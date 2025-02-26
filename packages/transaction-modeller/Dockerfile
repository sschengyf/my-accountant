# Use the Jupyter Notebook image from Quay.io as the base image
FROM quay.io/jupyter/scipy-notebook:latest

# Switch to root to install additional packages
USER root

# Install scikit-learn and other dependencies
RUN pip install scikit-learn sentence_transformers faiss-cpu

# Switch back to the default user to run the notebook
USER jovyan

# Expose the port Jupyter Notebook runs on
EXPOSE 8989

# Command to run Jupyter Notebook
CMD ["start-notebook.sh", "--NotebookApp.token=''"]