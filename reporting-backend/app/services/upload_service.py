from app.services.upload_config import UPLOAD_CONFIG


class UploadService:

    @staticmethod
    def get_config(upload_type: str):
        config = UPLOAD_CONFIG.get(upload_type)

        if config is None:
            raise Exception(f"Invalid upload type: {upload_type}")

        return config