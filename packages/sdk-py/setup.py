"""Setup configuration for xskynet-sdk."""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="xskynet-sdk",
    version="0.1.0",
    author="X-Skynet Project",
    author_email="nova@x-skynet.ai",
    description="Python SDK for the X-Skynet multi-agent orchestration platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ds0857/x-skynet",
    packages=find_packages(exclude=["tests*"]),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
    install_requires=[
        "requests>=2.28.0",
        "typing_extensions>=4.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "responses>=0.23.0",
        ],
    },
    keywords="xskynet sdk ai agents orchestration",
    project_urls={
        "Bug Reports": "https://github.com/ds0857/x-skynet/issues",
        "Source": "https://github.com/ds0857/x-skynet",
    },
)
