"""Helper utilities for Telugu QA System."""

import os
import yaml
from pathlib import Path
from typing import Dict, Any, Optional


def get_project_root() -> Path:
    """
    Get the project root directory.
    Works both locally and in Colab.
    """
    # Check if running in Colab
    if os.path.exists("/content"):
        # Check for direct extraction (colab-upload.zip structure)
        if (Path("/content/src").exists() and Path("/content/config").exists()):
            return Path("/content")
        # Check for wrapped structure (telugu-qa-system folder)
        colab_root = Path("/content/telugu-qa-system")
        if colab_root.exists():
            return colab_root
    
    # Local development - find project root by looking for config folder
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "config").exists() and (parent / "src").exists():
            return parent
    
    # Fallback to current working directory
    return Path.cwd()


def load_config(config_name: str) -> Dict[str, Any]:
    """
    Load a YAML configuration file.
    
    Args:
        config_name: Name of config file (e.g., "model_config" or "training_config")
        
    Returns:
        Dictionary with configuration values
    """
    project_root = get_project_root()
    
    # Add .yaml extension if not present
    if not config_name.endswith(".yaml"):
        config_name = f"{config_name}.yaml"
    
    config_path = project_root / "config" / config_name
    
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    return config


def get_device():
    """Get the best available device (CUDA > MPS > CPU)."""
    import torch
    
    if torch.cuda.is_available():
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


def setup_logging(log_level: str = "INFO"):
    """Setup logging configuration."""
    import logging
    
    logging.basicConfig(
        level=getattr(logging, log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    return logging.getLogger("telugu_qa")


def is_colab() -> bool:
    """Check if running in Google Colab."""
    try:
        import google.colab
        return True
    except ImportError:
        return False


def mount_drive():
    """Mount Google Drive in Colab."""
    if is_colab():
        from google.colab import drive
        drive.mount('/content/drive')
        return True
    return False
