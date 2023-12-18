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
    if (isCameraActive) {
      handleFaceDetection();
    } else {
      stopFaceDetection();
    }
    // Limpiar al desmontar el componente
    return () => {
      stopFaceDetection();
    };
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
    console.log("Solicitando acceso a la cámara...");
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        console.log("Acceso a cámara concedido, configurando video...");
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Metadatos del video cargados, reproduciendo video...");
          videoRef.current.play();
          setIsCameraActive(true);
        };
      })
      .catch(err => {
        console.error('Error al acceder a la cámara:', err);
        setIsCameraActive(false);
      });
  };


  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleStart = () => {
    console.log("Cargando modelos...");
    loadModels().then(() => {
      console.log("Modelos cargados, iniciando video...");
      startVideo();
    });
  };

  const handleFaceDetection = () => {
    if (isDetecting) {
      console.log("La detección de rostros ya está en curso.");
      return;
    }
    if (!isCameraActive || videoRef.current.readyState !== 4) {
      console.log("Cámara no activa o video no listo.");
      return;
    }

    setIsDetecting(true);
    console.log("Iniciando detección de rostros...");

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

        </>
      )}
      <video ref={videoRef} autoPlay muted style={{ display: isCameraActive ? 'block' : 'none', position: 'absolute' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute' }} />
    </div>
  );
};

export default FaceDetection;
