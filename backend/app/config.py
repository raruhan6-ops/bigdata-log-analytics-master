"""应用配置：从环境变量读取"""
import os
from dotenv import load_dotenv

load_dotenv()

# 项目根目录 = backend/app/ 的上两级
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))


class Settings:
    # Database — SQLite 默认，设 MYSQL_HOST 切 MySQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{PROJECT_ROOT}/data/log_analytics.db",
    )

    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3307"))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "loguser")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "logpass123")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "log_analytics")

    # App
    APP_TITLE: str = "日志分析平台 API"
    APP_VERSION: str = "1.0.0"

    @property
    def database_url(self) -> str:
        if self.MYSQL_HOST:
            return (
                f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
                f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
                f"?charset=utf8mb4"
            )
        return self.DATABASE_URL


settings = Settings()
