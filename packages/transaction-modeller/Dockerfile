# Use the Jupyter Notebook image from Quay.io as the base image
FROM quay.io/jupyter/scipy-notebook:latest

# Switch to root to install additional packages
USER root

# 1. Install build dependencies needed to compile ONNX wheel efficiently,
#    then install Python packages without saving a heavy cache directory.
#    We force the CPU version of PyTorch to avoid massive CUDA binaries.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    && pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    scikit-learn==1.6.1 \
    faiss-cpu==1.11.0 \
    skl2onnx==1.18.0 \
    onnxruntime==1.20.1 \
    onnx==1.17.0 \
    hf_xet==1.1.2 \
    sentence_transformers==4.1.0 \
    && apt-get purge -y --auto-remove build-essential cmake \
    && rm -rf /var/lib/apt/lists/*

# Switch back to the default user to run the notebook
USER jovyan

# Expose the port Jupyter Notebook runs on
EXPOSE 8989

# Command to run Jupyter Notebook
CMD ["start-notebook.sh", "--NotebookApp.token=''"]