import cv2
import numpy as np
from scipy import fftpack
from typing import Dict, Any, Tuple
from backend.app.config import ARTIFACTS_DIR

class FrequencyAnalyzerService:
    @staticmethod
    def analyze(image_bgr: np.ndarray, analysis_id: str) -> Dict[str, Any]:
        """
        Computes 2D Fast Fourier Transform (FFT) and 2D Discrete Cosine Transform (DCT)
        representations, saves visualizations, and calculates real frequency statistics.
        """
        # Convert to grayscale float32
        if len(image_bgr.shape) == 3:
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_bgr.copy()

        # Resize to fixed standard dimension for consistent frequency analysis
        norm_gray = cv2.resize(gray, (256, 256)).astype(np.float32)

        # -----------------------------
        # 1. 2D Fast Fourier Transform
        # -----------------------------
        f = np.fft.fft2(norm_gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-5)

        # Normalize magnitude to 0-255 for visualization
        norm_mag = cv2.normalize(magnitude_spectrum, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        fft_colored = cv2.applyColorMap(norm_mag, cv2.COLORMAP_INFERNO)

        fft_filename = f"fft_{analysis_id}.jpg"
        fft_path = ARTIFACTS_DIR / fft_filename
        cv2.imwrite(str(fft_path), fft_colored)

        # -----------------------------
        # 2. 2D Discrete Cosine Transform
        # -----------------------------
        # Compute 2D DCT
        dct_2d = fftpack.dct(fftpack.dct(norm_gray.T, norm='ortho').T, norm='ortho')
        log_dct = np.log(np.abs(dct_2d) + 1e-5)
        norm_dct = cv2.normalize(log_dct, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        dct_colored = cv2.applyColorMap(norm_dct, cv2.COLORMAP_VIRIDIS)

        dct_filename = f"dct_{analysis_id}.jpg"
        dct_path = ARTIFACTS_DIR / dct_filename
        cv2.imwrite(str(dct_path), dct_colored)

        # -----------------------------
        # 3. Frequency Feature Extraction
        # -----------------------------
        h, w = norm_gray.shape
        cy, cx = h // 2, w // 2
        y, x = np.ogrid[:h, :w]
        dist_from_center = np.sqrt((x - cx)**2 + (y - cy)**2)
        
        # High frequency boundary (outer 45% of spectrum)
        max_dist = np.sqrt(cx**2 + cy**2)
        high_freq_mask = dist_from_center > (0.45 * max_dist)
        
        total_energy = float(np.sum(np.abs(fshift)))
        high_freq_energy = float(np.sum(np.abs(fshift)[high_freq_mask]))
        high_freq_ratio = round(high_freq_energy / (total_energy + 1e-6), 4)

        # Spectral Centroid (mean frequency weighted by amplitude)
        spectral_centroid = round(float(np.sum(dist_from_center * np.abs(fshift)) / (total_energy + 1e-6)), 2)

        # Azimuthal deviation (detecting periodic grid peaks from GAN transposed convolutions)
        # Partition into 16 radial angular sectors
        angles = (np.arctan2(y - cy, x - cx) + np.pi) % np.pi
        sector_energies = []
        for i in range(16):
            sector_mask = (angles >= i * np.pi / 16) & (angles < (i + 1) * np.pi / 16)
            sector_energies.append(float(np.mean(magnitude_spectrum[sector_mask])))
        azimuthal_deviation = round(float(np.std(sector_energies)), 3)

        summary = (
            f"Frequency spectrum indicates a high-frequency energy ratio of {high_freq_ratio*100:.1f}%. "
            f"Azimuthal variation is {azimuthal_deviation} (peaks may correspond to synthetic upsampling grid artifacts)."
        )

        return {
            "fft_spectrum_url": f"/artifacts/{fft_filename}",
            "dct_spectrum_url": f"/artifacts/{dct_filename}",
            "high_freq_ratio": high_freq_ratio,
            "spectral_centroid": spectral_centroid,
            "azimuthal_deviation": azimuthal_deviation,
            "analysis_summary": summary
        }

frequency_analyzer_service = FrequencyAnalyzerService()
