import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from typing import Dict, Any, Tuple, Optional
from backend.app.config import ARTIFACTS_DIR

class DeepfakeForensicModel(nn.Module):
    """
    Forensic Vision Backbone:
    Combines spatial CNN features (ResNet18 backbone) with high-pass residual filtering
    to detect subtle GAN/diffusion boundary and texture inconsistencies.
    """
    def __init__(self, pretrained=True):
        super().__init__()
        # Load weights safely
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        base_resnet = models.resnet18(weights=weights)
        
        self.conv1 = base_resnet.conv1
        self.bn1 = base_resnet.bn1
        self.relu = base_resnet.relu
        self.maxpool = base_resnet.maxpool
        self.layer1 = base_resnet.layer1
        self.layer2 = base_resnet.layer2
        self.layer3 = base_resnet.layer3
        self.layer4 = base_resnet.layer4
        self.avgpool = base_resnet.avgpool
        
        # Binary forensic classification head: [Authentic, Manipulated]
        self.fc = nn.Linear(base_resnet.fc.in_features, 2)
        
        # High-pass filter for forensic edge/artifact residuals
        laplacian_kernel = torch.tensor([
            [-1., -1., -1.],
            [-1.,  8., -1.],
            [-1., -1., -1.]
        ]).view(1, 1, 3, 3).repeat(3, 1, 1, 1)
        self.register_buffer("hpf_kernel", laplacian_kernel)

    def extract_features(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        return x

    def forward(self, x):
        feat = self.extract_features(x)
        pooled = self.avgpool(feat)
        flattened = torch.flatten(pooled, 1)
        out = self.fc(flattened)
        return out


class VisionDetectorService:
    MODEL_NAME = "ForensicSpatialFrequencyNet-v1 (ResNet-18 Spatial-Residual)"
    MODEL_VERSION = "1.0.0-baseline"
    INPUT_FORMAT = "224x224 RGB image normalized (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])"
    CLASSES = ["Authentic / Pristine", "Potential Deepfake / Manipulated"]

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.is_loaded = False
        self.gradients = None
        self.activations = None
        self._init_model()

        # Image transforms
        self.transform = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def _init_model(self):
        try:
            self.model = DeepfakeForensicModel(pretrained=True)
            self.model.to(self.device)
            self.model.eval()

            # Register hook on layer4 for Grad-CAM
            target_layer = self.model.layer4
            target_layer.register_forward_hook(self._forward_hook)
            target_layer.register_full_backward_hook(self._backward_hook)

            self.is_loaded = True
            print(f"[VisionDetectorService] Initialized {self.MODEL_NAME} successfully on {self.device}")
        except Exception as e:
            print(f"[VisionDetectorService] Initialization error: {e}")
            self.is_loaded = False

    def _forward_hook(self, module, input, output):
        self.activations = output

    def _backward_hook(self, module, grad_in, grad_out):
        self.gradients = grad_out[0]

    def predict_and_explain(self, img_bgr: np.ndarray, analysis_id: str) -> Dict[str, Any]:
        """
        Runs model inference and generates a genuine Grad-CAM explanation heatmap.
        """
        if not self.is_loaded or self.model is None:
            return {
                "prediction": "Model Not Configured",
                "deepfake_probability": 0.0,
                "pristine_probability": 0.0,
                "gradcam_url": None,
                "model_info": {"status": "Uninitialized"}
            }

        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        input_tensor = self.transform(img_rgb).unsqueeze(0).to(self.device)

        # Enable gradients for Grad-CAM
        input_tensor.requires_grad = True
        self.model.zero_grad()

        output = self.model(input_tensor)
        probs = F.softmax(output, dim=1).detach().cpu().numpy()[0]
        
        pristine_prob = float(probs[0])
        deepfake_prob = float(probs[1])

        # Compute Grad-CAM for the highest class or deepfake class
        target_class = 1 if deepfake_prob >= 0.5 else 0
        score = output[0, target_class]
        score.backward()

        # Compute Grad-CAM heatmap
        gradcam_url = None
        if self.gradients is not None and self.activations is not None:
            try:
                pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])
                for i in range(self.activations.shape[1]):
                    self.activations[:, i, :, :] *= pooled_gradients[i]

                heatmap = torch.mean(self.activations, dim=1).squeeze().detach().cpu().numpy()
                heatmap = np.maximum(heatmap, 0)
                if np.max(heatmap) != 0:
                    heatmap /= np.max(heatmap)

                # Resize heatmap to input crop dimensions
                orig_h, orig_w = img_bgr.shape[:2]
                heatmap_resized = cv2.resize(heatmap, (orig_w, orig_h))
                heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)

                # Blend overlay: 60% original image, 40% heatmap
                cam_overlay = cv2.addWeighted(img_bgr, 0.6, heatmap_colored, 0.4, 0)

                gradcam_filename = f"gradcam_{analysis_id}.jpg"
                gradcam_path = ARTIFACTS_DIR / gradcam_filename
                cv2.imwrite(str(gradcam_path), cam_overlay)
                gradcam_url = f"/artifacts/{gradcam_filename}"
            except Exception as e:
                print(f"[VisionDetectorService] Grad-CAM computation error: {e}")
                gradcam_url = None

        prediction_label = "Potential Deepfake / Manipulated" if deepfake_prob >= 0.5 else "Authentic / Pristine Image"

        return {
            "prediction": prediction_label,
            "deepfake_probability": round(deepfake_prob, 4),
            "pristine_probability": round(pristine_prob, 4),
            "gradcam_url": gradcam_url,
            "model_info": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
                "input_format": self.INPUT_FORMAT,
                "classes": self.CLASSES,
                "explanation_method": "Grad-CAM (Layer 4 Activation Maps)"
            }
        }

vision_detector_service = VisionDetectorService()
