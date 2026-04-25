import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const FaceVerification = ({ onVerified, onSpoofDetected }) => {
  const videoRef = useRef(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [status, setStatus] = useState('Initializing camera...');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Normally models would be served from /models, we simulate loading for this example.
        // await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        // await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        setIsModelsLoaded(true);
        setStatus('Models loaded. Starting video...');
        startVideo();
      } catch (err) {
        setStatus('Error loading models.');
      }
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStatus('Ready to verify');
          }
        })
        .catch(err => {
          setStatus('Camera access denied or unavailable.');
        });
    };

    // For demonstration, simulating successful load instead of fetching massive models
    setTimeout(() => {
        setIsModelsLoaded(true);
        setStatus('Simulated AI model ready. Click verify.');
        startVideo();
    }, 1000);

    const currentVideo = videoRef.current;
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        const tracks = currentVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleVerify = () => {
    setStatus('Verifying...');

    // In a real implementation:
    // const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();

    // Simulate API delay
    setTimeout(() => {
      const mockConfidence = 0.95; // Simulated high confidence match
      const mockLiveness = true;   // Simulated liveness pass

      setConfidence(mockConfidence);
      setStatus('Verification Successful');

      onVerified({
        id: `fv_${Math.random().toString(36).substring(7)}`,
        status: 'success',
        confidenceScore: mockConfidence,
        livenessPassed: mockLiveness
      });
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '320px', height: '240px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ color: '#fff', fontSize: '14px' }}>
        {status}
        {confidence > 0 && <span style={{ marginLeft: '10px', color: '#4ade80' }}>Score: {(confidence * 100).toFixed(1)}%</span>}
      </div>
      <button
        className="btn-dark-primary"
        onClick={handleVerify}
        disabled={!isModelsLoaded}
      >
        Verify Face
      </button>
    </div>
  );
};

export default FaceVerification;
