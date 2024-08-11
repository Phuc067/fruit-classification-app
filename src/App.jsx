import { useState, useEffect, useRef } from "react";
import {
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from "react-image-crop";
import tinycolor from "tinycolor2";

import "react-image-crop/dist/ReactCrop.css";
import "./App.css";
import ReactCropComponent from "./components/ReactCropComponent";
import showToast from "./components/ToastComponent";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fruitColors } from "./constant/fruitColors";

const ASPECT_RATIO = 1;
const MIN_DIMENSION = 150;

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [crop, setCrop] = useState({
    unit: "%",
    width: 30,
    aspect: ASPECT_RATIO,
  });
  const [label, setLabel] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [borderColor, setBorderColor] = useState("#213547");

  const dropZoneRef = useRef();
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  useEffect(() => {
    const dropZone = dropZoneRef.current;

    const handleDrop = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];

        if (file) {
          const fileType = file.type;
          const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

          if (validImageTypes.includes(fileType)) {
            setSelectedImage(file);
            setIsCropping(false);
          } else {
            showToast('File không phải là ảnh hợp lệ.', 'warn');
          }
        }
      }
    };

    const handleDragOver = (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.add("dragging");
    };

    const handleDragLeave = (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.classList.remove("dragging");
    };

    const handlePaste = (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          setSelectedImage(file);
          setIsCropping(false);
        }
      }
    };

    dropZone.addEventListener("drop", handleDrop);
    dropZone.addEventListener("dragover", handleDragOver);
    dropZone.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("paste", handlePaste);

    return () => {
      dropZone.removeEventListener("drop", handleDrop);
      dropZone.removeEventListener("dragover", handleDragOver);
      dropZone.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  useEffect(() => {
    if (selectedImage && !isCropping) {
      const previewURL = URL.createObjectURL(selectedImage);
      setImagePreview(previewURL);

      handleImageUpload(previewURL, selectedImage);

      return () => {
        URL.revokeObjectURL(previewURL);
      };
    }
  }, [selectedImage, isCropping]);

  const handleImageUpload = async (imageURL, imageFile) => {
    setLabel("");
    setConfidence(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");

      }

      const result = await response.json();
      setLabel(result.predicted_class);
      setConfidence(result.confidence);
      const backgroundColor = fruitColors[result.predicted_class] || "#FFFFFF";
      document.body.style.backgroundColor = backgroundColor;
      const darkerBackgroundColor = tinycolor(backgroundColor)
        .darken(50)
        .toString();
      document.querySelector(".drop-zone").style.borderColor =
        darkerBackgroundColor;
      setBorderColor(darkerBackgroundColor);
      showToast("Image recognized successfully!", "success");
    } catch (error) {
      showToast("Unable to connect to the server. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCrop = () => {
    if (!imgRef.current || !previewCanvasRef.current || !crop) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = imgRef.current;
    const pixelCrop = convertToPixelCrop(crop, width, height);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      imgRef.current,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], selectedImage.name, { type: blob.type });
        handleImageUpload(URL.createObjectURL(file), file);
      }
    }, "image/jpeg");
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const fileType = file.type;
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (validImageTypes.includes(fileType)) {
        setSelectedImage(file);
        setIsCropping(false);
      } else {
        showToast('File không phải là ảnh hợp lệ.', 'warn');
      }
    }
  };

  return (
    <div className="App">
      <h1>Fruit Classification</h1>
      <div className="container">
        <div className="left-column">
          <p>Drag & Drop image below or click to select from device</p>
          <div ref={dropZoneRef} className="drop-zone">
            <input
              type="file"
              onChange={handleImageChange}
              disabled={isCropping}
            />
            {imagePreview && !isCropping && (
              <img
                src={imagePreview}
                alt="Selected"
                className="image-preview"
              />
            )}
            {isCropping && imagePreview && (
              <ReactCropComponent
                imagePreview={imagePreview}
                crop={crop}
                setCrop={setCrop}
                MIN_DIMENSION={MIN_DIMENSION}
                makeAspectCrop={makeAspectCrop}
                ASPECT_RATIO={ASPECT_RATIO}
                centerCrop={centerCrop}
                imgRef={imgRef}
              />
            )}
          </div>

          {label && (
            <button
              style={{ borderColor: borderColor }}
              onClick={() => setIsCropping(!isCropping)}
            >
              {isCropping ? "Finish Cropping" : "Crop Image"}
            </button>
          )}
          {isCropping && (
            <button
              style={{ borderColor: borderColor, marginTop: "8px" }}
              onClick={handleCrop}
            >
              Apply Crop
            </button>
          )}
          <canvas
            ref={previewCanvasRef}
            style={{
              display: "none",
              border: "1px solid black",
              objectFit: "contain",
            }}
          />
        </div>
        <div className="right-column">
          {loading && <div className="loader"></div>}
          {label && (
            <div>
              <h2>
                Type of fruit:{" "}
                <span style={{ color: borderColor }}>{label}</span>
              </h2>
              {confidence !== null && (
                <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
              )}
            </div>
          )}
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover
          theme="light"
          transition:Bounce/>
      </div>
    </div>


  );
}

export default App;
