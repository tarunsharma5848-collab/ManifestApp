import { useRef, useState } from 'react';
import api from '../api/client';

export default function VoiceRecorder({ affirmationId, existingAudioUrl, onSaved }) {
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showRecorder, setShowRecorder] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const blobRef = useRef(null);

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSave = async () => {
    if (!blobRef.current) return;
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', blobRef.current, 'affirmation.webm');
      const res = await api.post(`/affirmations/${affirmationId}/voice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSaved?.(res.data.affirmation);
      setPreviewUrl(null);
      setShowRecorder(false);
    } catch (err) {
      setError('Could not save recording');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPreviewUrl(null);
    blobRef.current = null;
  };

  if (!showRecorder && !existingAudioUrl) {
    return (
      <button
        onClick={() => setShowRecorder(true)}
        className="text-xs text-cosmic-lavender-light underline shrink-0"
        title="Record your voice"
      >
        🎙 Record
      </button>
    );
  }

  if (!showRecorder && existingAudioUrl) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <audio controls src={existingAudioUrl} className="h-7 max-w-[140px]" />
        <button
          onClick={() => setShowRecorder(true)}
          className="text-xs text-cosmic-lavender-light underline"
        >
          Re-record
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {error && <span className="text-xs text-red-400">{error}</span>}

      {!previewUrl && !recording && (
        <button onClick={startRecording} className="text-xs text-cosmic-gold underline">
          ● Start
        </button>
      )}

      {recording && (
        <button onClick={stopRecording} className="text-xs text-red-400 underline animate-pulse">
          ■ Stop
        </button>
      )}

      {previewUrl && (
        <>
          <audio controls src={previewUrl} className="h-7 max-w-[120px]" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs text-cosmic-gold underline disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleDiscard} className="text-xs text-cosmic-star/50 underline">
            Discard
          </button>
        </>
      )}

      <button
        onClick={() => {
          setShowRecorder(false);
          handleDiscard();
        }}
        className="text-xs text-cosmic-star/40"
      >
        ✕
      </button>
    </div>
  );
}
