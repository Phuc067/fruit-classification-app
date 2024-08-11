/* eslint-disable react/prop-types */
import ReactCrop from "react-image-crop";

export default function ReactCropComponent({
  imagePreview,
  crop,
  setCrop,
  MIN_DIMENSION,
  makeAspectCrop,
  ASPECT_RATIO,
  centerCrop,
  imgRef,
}) {
  return (
    <ReactCrop
      src={imagePreview}
      crop={crop}
      onChange={(newCrop) => setCrop(newCrop)}
      onImageLoaded={(image) => {
        const { width, height } = image;
        const cropWidthInPercent = (MIN_DIMENSION / width) * 100;

        const initialCrop = makeAspectCrop(
          {
            unit: "%",
            width: cropWidthInPercent,
          },
          ASPECT_RATIO,
          width,
          height
        );
        const centeredCrop = centerCrop(initialCrop, width, height);
        setCrop(centeredCrop);
      }}
    >
      <img
        ref={imgRef}
        src={imagePreview}
        alt="Selected"
        style={{ maxHeight: "70vh" }}
      />
    </ReactCrop>
  );
}
