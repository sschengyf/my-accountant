# Use the Jupyter Notebook image from Quay.io as the base image
FROM quay.io/jupyter/scipy-notebook:latest

# Switch to root to install additional packages
USER root

# Install scikit-learn and other dependencies
RUN pip install scikit-learn==1.6.1 sentence_transformers==4.1.0 faiss-cpu==1.11.0 skl2onnx==1.18.0 onnxruntime==1.20.1 onnx==1.17.0 hf_xet==1.1.2

# Switch back to the default user to run the notebook
USER jovyan

# Expose the port Jupyter Notebook runs on
EXPOSE 8989

# Command to run Jupyter Notebook
CMD ["start-notebook.sh", "--NotebookApp.token=''"]