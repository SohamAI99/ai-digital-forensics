from PIL import Image, ExifTags
from typing import Dict, Any, List

SUSPICIOUS_SOFTWARE = [
    "photoshop", "gimp", "canva", "lightroom", "snapseed", "picsart", "facetune",
    "stable diffusion", "midjourney", "dall-e", "paint.net", "after effects"
]

class ExifService:
    @staticmethod
    def extract_exif(pil_img: Image.Image) -> Dict[str, Any]:
        """
        Safely extracts EXIF metadata from a PIL Image.
        Returns parsed fields, anomaly flags, and raw tags.
        """
        raw_tags = {}
        anomaly_flags = []
        has_exif = False

        make = None
        model = None
        datetime_orig = None
        software = None
        width = pil_img.width
        height = pil_img.height

        try:
            exif_data = pil_img._getexif()
            if exif_data:
                has_exif = True
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Convert bytes to string if needed
                    if isinstance(value, bytes):
                        try:
                            value = value.decode('utf-8', errors='ignore')
                        except Exception:
                            value = str(value)
                    elif not isinstance(value, (int, float, str, list, dict)):
                        value = str(value)

                    raw_tags[tag_name] = value

                make = raw_tags.get("Make")
                model = raw_tags.get("Model")
                datetime_orig = raw_tags.get("DateTimeOriginal") or raw_tags.get("DateTime")
                software = raw_tags.get("Software")

                # Check for software tampering traces
                if software:
                    sw_lower = str(software).lower()
                    for s in SUSPICIOUS_SOFTWARE:
                        if s in sw_lower:
                            anomaly_flags.append(f"Image edited or generated using graphics software: '{software}'")
                            break

        except Exception as e:
            has_exif = False

        if not has_exif:
            anomaly_flags.append("No EXIF metadata present (common in social media uploads, screenshots, or AI-generated images).")
        elif not make and not model:
            anomaly_flags.append("Camera hardware tags (Make/Model) are absent from EXIF structure.")

        return {
            "make": make,
            "model": model,
            "datetime_original": datetime_orig,
            "software": software,
            "image_width": width,
            "image_height": height,
            "has_exif": has_exif,
            "anomaly_flags": anomaly_flags,
            "raw_tags": {k: str(v)[:100] for k, v in list(raw_tags.items())[:25]}
        }

exif_service = ExifService()
