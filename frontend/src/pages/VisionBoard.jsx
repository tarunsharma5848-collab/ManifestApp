import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import ShareCardModal from '../components/ShareCardModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function VisionBoard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [shareItem, setShareItem] = useState(null);
  const [todayAffirmation, setTodayAffirmation] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const fileInputRef = useRef(null);

  const loadItems = async () => {
    try {
      const [itemsRes, affirmationRes] = await Promise.all([
        api.get('/vision-board'),
        api.get('/affirmations/today').catch(() => ({ data: { affirmation: null } })),
      ]);
      setItems(itemsRes.data.items);
      setTodayAffirmation(affirmationRes.data.affirmation?.text || '');
    } catch (err) {
      setError('Could not load your vision board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/vision-board', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setItems((prev) => [...prev, res.data.item]);
      window.dispatchEvent(new Event('manifest:xp-changed'));
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmDelete = async () => {
    const id = confirmId;
    setConfirmId(null);
    const prev = items;
    setItems((cur) => cur.filter((it) => it.id !== id));
    try {
      await api.delete(`/vision-board/${id}`);
      window.dispatchEvent(new Event('manifest:xp-changed'));
    } catch (err) {
      setItems(prev); // revert on failure
      setError('Could not delete image');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-3xl text-cosmic-gold">Vision Board</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep text-sm font-medium px-4 py-2 hover:bg-cosmic-gold-light transition disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : '+ Add Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      <p className="text-cosmic-star/60 mb-8">Pin the images of the life you're calling in.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-cosmic-star/50">Loading...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-cosmic-lavender/30 p-12 text-center text-cosmic-star/50">
          No images yet. Click "+ Add Image" to start building your vision board.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden aspect-square border border-cosmic-lavender/20"
            >
              <img
                src={item.image_url}
                alt={item.caption || 'Vision board image'}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => setShareItem(item)}
                  className="rounded-full bg-cosmic-navy-deep/80 text-cosmic-star text-xs w-7 h-7 flex items-center justify-center"
                  aria-label="Share image"
                  title="Share"
                >
                  ↗
                </button>
                <button
                  onClick={() => setConfirmId(item.id)}
                  className="rounded-full bg-cosmic-navy-deep/80 text-cosmic-star text-xs w-7 h-7 flex items-center justify-center"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareItem && (
        <ShareCardModal
          item={shareItem}
          affirmationText={todayAffirmation}
          onClose={() => setShareItem(null)}
        />
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Remove this image?"
        message="This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
