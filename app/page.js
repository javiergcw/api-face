"use client"
import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FaceDetection = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionInterval = useRef(null); // Correctamente declarado como useRef


  useEffect(() => {
    // Pre-cargar la imagen del sombrero


    if (isCameraActive) {
      const displaySize = { width: videoRef.current.offsetWidth, height: videoRef.current.offsetHeight };
      faceapi.matchDimensions(canvasRef.current, displaySize);
    }
  }, [isCameraActive]);

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      // Carga otros modelos si es necesario
    ]);
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraActive(true);
          handleFaceDetection(); // Iniciar la detección de rostros automáticamente
        };
      })
      .catch(err => console.error('Error al acceder a la cámara:', err));
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleStart = () => {
    loadModels().then(() => {
      startVideo();
      setIsCameraActive(true);
    });
  };

  const handleFaceDetection = () => {
    if (!isCameraActive || videoRef.current.readyState !== 4) return;

    if (isDetecting) {
      // Si ya se está detectando, limpiar el intervalo existente
      clearInterval(detectionInterval.current);
    } else {
      setIsDetecting(true);
    }
    const options = new faceapi.TinyFaceDetectorOptions();
    // Asegúrate de que el canvas tenga el mismo tamaño que el video
    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };
    // Ajusta el tamaño del canvas para que coincida con el tamaño del video
    canvasRef.current.width = displaySize.width;
    canvasRef.current.height = displaySize.height;
    faceapi.matchDimensions(canvasRef.current, displaySize);

    detectionInterval.current = setInterval(async () => {
      const detections = await faceapi.detectAllFaces(videoRef.current, options)
        .withFaceLandmarks(); // Asegúrate de que cargaste este modelo
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Dibuja los landmarks y el sombrero en el canvas
      resizedDetections.forEach(detection => {
        // Dibuja los landmarks
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        // Aquí podrías agregar la lógica para dibujar el sombrero
        // ...
      });
    }, 100);
  };

  const stopFaceDetection = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
      setIsDetecting(false);
    }
  };

  return (
    <div>
      {!isCameraActive ? (
        <button onClick={handleStart}>Activar Cámara</button>
      ) : (
        <>
          <button onClick={stopVideo}>Desactivar Cámara</button>
          <br />
          <button onClick={isDetecting ? stopFaceDetection : handleFaceDetection}>
            {isDetecting ? 'Detener Verificación de Rostros' : 'Verificar Rostros'}
          </button>
        </>
      )}
      <video ref={videoRef} autoPlay muted style={{ display: isCameraActive ? 'block' : 'none', position: 'absolute' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute' }} />
    </div>
  );
};

export default FaceDetection;
