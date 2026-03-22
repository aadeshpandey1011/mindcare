import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getPosts, createPost, deletePost, toggleSupport, addReply, reportPost,
    adminDeletePost, adminDeleteReply, restorePost, dismissReports,
    warnUser, banUser, unbanUser,
} from '../api/forumApi';

// ── constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
    { name: 'Stress',        icon: '🌊', accent: '#6366f1', light: '#eef2ff' },
    { name: 'Exams',         icon: '📖', accent: '#0ea5e9', light: '#f0f9ff' },
    { name: 'Sleep',         icon: '🌙', accent: '#8b5cf6', light: '#f5f3ff' },
    { name: 'Relationships', icon: '🤝', accent: '#ec4899', light: '#fdf2f8' },
    { name: 'Anxiety',       icon: '🫁', accent: '#f59e0b', light: '#fffbeb' },
    { name: 'General',       icon: '💬', accent: '#10b981', light: '#ecfdf5' },
];

const MAX_MEDIA = 4;
const ACCEPTED  = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';

// ── Ad data ───────────────────────────────────────────────────────────────────
const LEFT_ADS = [
    { name: 'Dr. Priya Sharma', title: 'Licensed Psychologist', tagline: 'Specialising in anxiety, stress & exam pressure. Confidential sessions.', specialty: 'Anxiety & Stress', rating: '4.9', sessions: '340+', badge: '⭐ Top Rated', accent: '#6366f1', light: '#eef2ff', initials: 'PS', ctaText: 'Book Free Consult' },
    { name: 'Dr. Arjun Mehta',  title: 'CBT Therapist',         tagline: 'Cognitive Behavioural Therapy for depression, burnout & relationship issues.', specialty: 'CBT & Depression', rating: '4.8', sessions: '210+', badge: '✓ Verified',  accent: '#0ea5e9', light: '#f0f9ff', initials: 'AM', ctaText: 'Book a Session' },
];

const RIGHT_ADS = [
    { name: 'Dr. Kavya Nair',  title: 'Sleep & Mindfulness Expert',  tagline: 'Evidence-based sleep coaching and mindfulness programmes for students.', specialty: 'Sleep & Mindfulness', rating: '4.9', sessions: '180+', badge: '🌙 Sleep Specialist', accent: '#8b5cf6', light: '#f5f3ff', initials: 'KN', ctaText: 'Book Free Consult' },
    { name: 'Dr. Rohan Verma', title: 'Relationship Counsellor',     tagline: 'Individual and couples counselling. Safe, judgement-free environment.',  specialty: 'Relationships',      rating: '4.7', sessions: '290+', badge: '🤝 Highly Trusted',  accent: '#ec4899', light: '#fdf2f8', initials: 'RV', ctaText: 'Book a Session' },
];

// ── helpers ───────────────────────────────────────────────────────────────────
const initials = (n) => (n || 'A').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const timeAgo  = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};
const authorName  = (post) => post.isAnonymous ? 'Anonymous' : (post.userId?.fullName || post.userId?.name || post.userId?.username || 'Unknown');
const replyAuthor = (r)    => r.isAnonymous    ? 'Anonymous' : (r.userId?.fullName    || r.userId?.name    || r.userId?.username    || 'Unknown');

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40, accent = '#6366f1', isAnon = false }) {
    const [err, setErr] = useState(false);
    if (isAnon) return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4 }}>🎭</div>;
    if (src && !err) return <img src={src} alt={name} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: size * 0.35 }}>{initials(name)}</div>;
}

// ── Media Gallery (displayed inside post cards) ───────────────────────────────
function MediaGallery({ media }) {
    const [lightbox, setLightbox] = useState(null); // url of full-size item
    if (!media || media.length === 0) return null;

    const gridCols = media.length === 1 ? '1fr' : media.length === 2 ? '1fr 1fr' : media.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr';

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 4, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
                {media.map((m, i) => (
                    <div key={i} style={{ position: 'relative', cursor: 'pointer', background: '#f1f5f9', aspectRatio: media.length === 1 ? '16/9' : '1' }}
                        onClick={() => setLightbox(m)}>
                        {m.type === 'video' ? (
                            <>
                                {m.thumbnail
                                    ? <img src={m.thumbnail} alt="video" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                }
                                {/* play icon overlay */}
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <img src={m.url} alt="post media" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        )}
                        {/* +N overlay on last tile when more than 4 */}
                        {i === 3 && media.length > 4 && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
                                +{media.length - 4}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => setLightbox(null)}>
                    {lightbox.type === 'video' ? (
                        <video src={lightbox.url} controls autoPlay style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10 }} onClick={e => e.stopPropagation()} />
                    ) : (
                        <img src={lightbox.url} alt="full size" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
                    )}
                    <button onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 20, right: 24, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 22, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
            )}
        </>
    );
}

// ── Media preview strip (compose box — before posting) ────────────────────────
function MediaPreview({ files, onRemove }) {
    if (!files || files.length === 0) return null;
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {files.map((file, i) => {
                const isVideo = file.type.startsWith('video/');
                const objUrl  = URL.createObjectURL(file);
                return (
                    <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                        {isVideo
                            ? <div style={{ width: '100%', height: '100%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </div>
                            : <img src={objUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        }
                        <button onClick={() => onRemove(i)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
                        {isVideo && <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 9, color: '#fff', background: 'rgba(0,0,0,.5)', padding: '1px 4px', borderRadius: 3 }}>VIDEO</div>}
                    </div>
                );
            })}
        </div>
    );
}

// ── Counsellor Ad Card ────────────────────────────────────────────────────────
function CounsellorAd({ ad }) {
    const [hov, setHov] = useState(false);
    return (
        <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: hov ? `0 8px 28px ${ad.accent}22, 0 0 0 1px ${ad.accent}30` : '0 1px 4px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.05)', transition: 'box-shadow .2s, transform .2s', transform: hov ? 'translateY(-2px)' : 'none', marginBottom: 14 }}>
            <div style={{ height: 4, background: ad.accent }} />
            <div style={{ padding: '6px 12px 0', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.06em', color: '#94a3b8', textTransform: 'uppercase' }}>Sponsored</span>
            </div>
            <div style={{ padding: '10px 14px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: ad.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>{ad.initials}</div>
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{ad.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{ad.title}</p>
                    </div>
                </div>
                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ad.light, color: ad.accent, marginBottom: 8 }}>{ad.badge}</span>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#475569', lineHeight: 1.55 }}>{ad.tagline}</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>⭐ {ad.rating}</p><p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Rating</p></div>
                    <div style={{ width: 1, background: '#f1f5f9' }} />
                    <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{ad.sessions}</p><p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Sessions</p></div>
                    <div style={{ width: 1, background: '#f1f5f9' }} />
                    <div style={{ textAlign: 'center' }}><p style={{ margin: 0, fontWeight: 600, fontSize: 11, color: ad.accent }}>{ad.specialty}</p><p style={{ margin: 0, fontSize: 10, color: '#94a3b8' }}>Focus</p></div>
                </div>
                <button onClick={() => window.location.href = '/booking'} style={{ width: '100%', padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: hov ? ad.accent : ad.light, color: hov ? '#fff' : ad.accent, transition: 'all .2s' }}>
                    {ad.ctaText} →
                </button>
            </div>
        </div>
    );
}

function WellnessTip() {
    const tips = [
        { icon: '💧', text: 'Drink a glass of water right now.' },
        { icon: '🌬️', text: '4-7-8 breathing: inhale 4s, hold 7s, exhale 8s.' },
        { icon: '🚶', text: 'A 10-minute walk reduces cortisol by 15%.' },
        { icon: '📵', text: 'No screens 30 min before bed improves sleep quality.' },
        { icon: '📝', text: "Write 3 things you are grateful for today." },
    ];
    const [idx] = useState(() => Math.floor(Math.random() * tips.length));
    const tip = tips[idx];
    return (
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 14 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Daily Wellness Tip</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{tip.icon}</span>
                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{tip.text}</p>
            </div>
        </div>
    );
}

function AdvertiseCard({ accent }) {
    return (
        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '18px 16px', textAlign: 'center', border: '1.5px dashed #cbd5e1', marginBottom: 14 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>📢 Advertise here</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>Reach students who need mental health support.</p>
            <button onClick={() => window.location.href = '/contact'} style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${accent}`, background: 'transparent', color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Get in touch
            </button>
        </div>
    );
}

function ReasonModal({ title, subtitle, placeholder, confirmLabel, danger, onConfirm, onCancel }) {
    const [text, setText] = useState('');
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onCancel}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 30, width: 440, maxWidth: '92vw', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
                {subtitle && <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>{subtitle}</p>}
                <textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#0f172a', background: '#f8fafc' }} />
                <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 20px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>Cancel</button>
                    <button onClick={() => text.trim() && onConfirm(text.trim())} disabled={!text.trim()} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', background: danger ? '#ef4444' : '#6366f1', opacity: text.trim() ? 1 : 0.4 }}>{confirmLabel || 'Confirm'}</button>
                </div>
            </div>
        </div>
    );
}

function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
    const bg = { success: '#10b981', error: '#ef4444', info: '#6366f1', warn: '#f59e0b' }[type] || '#6366f1';
    return <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 99999, background: bg, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500, boxShadow: '0 8px 28px rgba(0,0,0,.2)', maxWidth: 340 }}>{msg}</div>;
}

function ActionBtn({ icon, label, active, color, onClick, disabled }) {
    const [hov, setHov] = useState(false);
    return (
        <button onClick={onClick} disabled={disabled} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: disabled ? 'default' : 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .12s', background: (hov || active) && !disabled ? color + '15' : 'transparent', color: (hov || active) && !disabled ? color : '#64748b', opacity: disabled ? 0.5 : 1 }}>
            {icon} {label}
        </button>
    );
}

function AdminItem({ icon, label, color, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', background: hov ? color + '14' : 'transparent', color: hov ? color : '#374151', fontSize: 13, fontWeight: 500, textAlign: 'left', transition: 'all .12s' }}>
            <span style={{ fontSize: 15 }}>{icon}</span> {label}
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function Forum() {
    const { user } = useAuth();
    const isAdmin  = user?.role === 'admin';
    const uid      = user?._id || user?.id;

    const [category,       setCategory]       = useState('Stress');
    const [posts,          setPosts]           = useState([]);
    const [loading,        setLoading]         = useState(false);
    const [showDeleted,    setShowDeleted]     = useState(false);

    // compose
    const [newPost,        setNewPost]         = useState({ title: '', description: '', tags: '' });
    const [postAnon,       setPostAnon]        = useState(false);
    const [mediaFiles,     setMediaFiles]      = useState([]);  // File[] — local files before upload
    const [posting,        setPosting]         = useState(false);
    const fileInputRef     = useRef(null);

    // per-post UI state
    const [expanded,       setExpanded]        = useState({});
    const [replyText,      setReplyText]       = useState({});
    const [replyAnon,      setReplyAnon]       = useState({});
    const [adminOpen,      setAdminOpen]       = useState({});
    const [replyAdminOpen, setReplyAdminOpen]  = useState({});
    const [reported,       setReported]        = useState({});
    const [modal,          setModal]           = useState(null);
    const [toast,          setToast]           = useState(null);

    const cat      = CATEGORIES.find(c => c.name === category) || CATEGORIES[0];
    const dropRef  = useRef({});
    const rdropRef = useRef({});

    useEffect(() => {
        const handler = (e) => {
            setAdminOpen(prev => { const next = { ...prev }; Object.keys(next).forEach(id => { if (dropRef.current[id] && !dropRef.current[id].contains(e.target)) next[id] = false; }); return next; });
            setReplyAdminOpen(prev => { const next = { ...prev }; Object.keys(next).forEach(id => { if (rdropRef.current[id] && !rdropRef.current[id].contains(e.target)) next[id] = false; }); return next; });
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { fetchPosts(); }, [category, showDeleted]);

    const fetchPosts = async () => {
        setLoading(true);
        try { const res = await getPosts(category, { userId: uid, isAdmin, showDeleted: isAdmin && showDeleted }); setPosts(res.data); }
        catch { showToast('Failed to load posts', 'error'); }
        finally { setLoading(false); }
    };

    const showToast = (msg, type = 'info') => setToast({ msg, type });

    // ── file picker ───────────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files || []);
        if (mediaFiles.length + selected.length > MAX_MEDIA) {
            showToast(`Maximum ${MAX_MEDIA} files per post`, 'error');
            e.target.value = '';
            return;
        }
        setMediaFiles(prev => [...prev, ...selected]);
        e.target.value = ''; // reset so same file can be re-picked
    };

    const removeMedia = (idx) => setMediaFiles(prev => prev.filter((_, i) => i !== idx));

    // ── create post ───────────────────────────────────────────────────────────
    const handlePost = async () => {
        if (!newPost.title.trim() || !newPost.description.trim()) { showToast('Title and description required', 'error'); return; }
        if (!uid) { showToast('Please log in to post', 'error'); return; }
        setPosting(true);
        try {
            await createPost({
                title:       newPost.title.trim(),
                description: newPost.description.trim(),
                tags:        newPost.tags,
                category,
                userId:      uid,
                isAnonymous: postAnon,
                mediaFiles,
            });
            setNewPost({ title: '', description: '', tags: '' });
            setPostAnon(false);
            setMediaFiles([]);
            fetchPosts();
            showToast('Post shared!', 'success');
        } catch (err) { showToast(err?.response?.data?.message || 'Failed to create post', 'error'); }
        finally { setPosting(false); }
    };

    const handleDeleteOwn = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try { await deletePost(postId, uid); setPosts(p => p.filter(x => x._id !== postId)); showToast('Post deleted', 'info'); }
        catch { showToast('Could not delete', 'error'); }
    };

    const handleSupport = async (postId) => {
        if (!user) { showToast('Log in to support', 'error'); return; }
        try { const res = await toggleSupport(postId, uid); setPosts(p => p.map(x => x._id === postId ? { ...x, supportCount: res.data.supportCount, hasSupported: res.data.hasSupported } : x)); }
        catch { showToast('Failed', 'error'); }
    };

    const handleReply = async (postId) => {
        const text = replyText[postId]?.trim();
        if (!text) return;
        try {
            const res = await addReply(postId, text, uid, replyAnon[postId] || false);
            setPosts(p => p.map(x => x._id === postId ? res.data : x));
            setReplyText(r => ({ ...r, [postId]: '' }));
            setReplyAnon(r => ({ ...r, [postId]: false }));
        } catch { showToast('Failed to reply', 'error'); }
    };

    const handleReportConfirm = async (reason) => {
        try { await reportPost(modal.postId, uid, reason); setReported(r => ({ ...r, [modal.postId]: true })); setModal(null); showToast('Report submitted. Thank you for keeping the forum safe.', 'success'); }
        catch (err) { showToast(err?.response?.data?.message || 'Failed to report', 'error'); setModal(null); }
    };

    const handleAdminDeleteConfirm = async (reason) => {
        try { await adminDeletePost(modal.postId, reason); if (!showDeleted) setPosts(p => p.filter(x => x._id !== modal.postId)); else fetchPosts(); setModal(null); showToast('Post removed', 'info'); }
        catch { showToast('Failed to remove', 'error'); setModal(null); }
    };

    const handleRestore = async (postId) => {
        try { await restorePost(postId); fetchPosts(); showToast('Post restored', 'success'); }
        catch { showToast('Failed to restore', 'error'); }
    };

    const handleDismissReports = async (postId) => {
        try { await dismissReports(postId); fetchPosts(); showToast('Reports cleared', 'success'); }
        catch { showToast('Failed', 'error'); }
    };

    const handleWarnConfirm = async (reason) => {
        try { const res = await warnUser(modal.postId, reason); setModal(null); showToast(res.data.autoBanned ? `User auto-banned after ${res.data.warningCount} warnings` : `Warning issued (${res.data.warningCount} total)`, 'warn'); fetchPosts(); }
        catch { showToast('Failed to warn', 'error'); setModal(null); }
    };

    const handleBanConfirm = async (reason) => {
        try { await banUser(modal.userId, reason); setModal(null); showToast('User banned from forum', 'error'); fetchPosts(); }
        catch { showToast('Failed to ban', 'error'); setModal(null); }
    };

    const handleUnban = async (userId) => {
        try { await unbanUser(userId); showToast('User unbanned', 'success'); fetchPosts(); }
        catch { showToast('Failed to unban', 'error'); }
    };

    const handleAdminDeleteReplyConfirm = async () => {
        try { await adminDeleteReply(modal.postId, modal.replyId); setModal(null); showToast('Reply removed', 'info'); fetchPosts(); }
        catch { showToast('Failed to remove reply', 'error'); setModal(null); }
    };

    const isOwner = (post) => uid && post.userId?._id === uid;

    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${cat.accent}18, ${cat.accent}06)`, borderBottom: `1px solid ${cat.accent}22`, padding: '32px 0 0' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                        <span style={{ fontSize: 32 }}>{cat.icon}</span>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f172a' }}>Peer Support Forum</h1>
                            <p style={{ margin: '3px 0 0', fontSize: 14, color: '#64748b' }}>A safe space to share, listen, and heal together</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {CATEGORIES.map(c => (
                            <button key={c.name} onClick={() => setCategory(c.name)} style={{ padding: '8px 16px', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s', background: category === c.name ? '#fff' : 'transparent', color: category === c.name ? c.accent : '#64748b', boxShadow: category === c.name ? `0 -2px 0 ${c.accent} inset` : 'none' }}>
                                <span>{c.icon}</span>{c.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3-column layout */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 20px 60px', display: 'grid', gridTemplateColumns: '220px 1fr 220px', gap: 24, alignItems: 'start' }}>

                {/* LEFT sidebar */}
                <aside style={{ position: 'sticky', top: 20 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>Featured Counsellors</p>
                    {LEFT_ADS.map((ad, i) => <CounsellorAd key={i} ad={ad} />)}
                    <WellnessTip />
                </aside>

                {/* CENTRE */}
                <main>
                    {user?.isBannedFromForum && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 10, fontSize: 14, color: '#991b1b', alignItems: 'center' }}>
                            <span style={{ fontSize: 20 }}>🚫</span>
                            <span>Your account has been restricted from posting in this forum.{user.banReason ? ` Reason: ${user.banReason}` : ''}</span>
                        </div>
                    )}

                    {/* Compose box */}
                    {!user?.isBannedFromForum && user && (
                        <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)' }}>
                            {/* header row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Avatar src={postAnon ? null : user?.avatar} name={user?.fullName} size={38} accent={cat.accent} isAnon={postAnon} />
                                    <span style={{ fontSize: 14, color: '#64748b' }}>{postAnon ? 'Posting anonymously' : `Posting as ${user?.fullName}`}</span>
                                </div>
                                {/* anonymous toggle */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', background: postAnon ? '#6366f1' : '#cbd5e1', transition: 'background .2s' }}>
                                        <div style={{ position: 'absolute', top: 2, left: postAnon ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                                        <input type="checkbox" checked={postAnon} onChange={e => setPostAnon(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', margin: 0 }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>🎭 Anonymous</span>
                                </label>
                            </div>

                            <input type="text" placeholder="What's on your mind?" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', outline: 'none', marginBottom: 10, color: '#0f172a', background: '#f8fafc' }} />
                            <textarea rows={3} placeholder="Share more details — you are among friends here." value={newPost.description} onChange={e => setNewPost(p => ({ ...p, description: e.target.value }))}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 10, color: '#0f172a', background: '#f8fafc' }} />

                            {/* media preview */}
                            <MediaPreview files={mediaFiles} onRemove={removeMedia} />

                            {/* bottom row: tags + media button + post button */}
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: mediaFiles.length > 0 ? 10 : 0 }}>
                                <input type="text" placeholder="Tags: anxiety, exams, sleep" value={newPost.tags} onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                                    style={{ flex: 1, minWidth: 120, padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0f172a', background: '#f8fafc' }} />

                                {/* Media attach button */}
                                <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple style={{ display: 'none' }} onChange={handleFileChange} />
                                <button onClick={() => fileInputRef.current?.click()} disabled={mediaFiles.length >= MAX_MEDIA}
                                    title={mediaFiles.length >= MAX_MEDIA ? `Max ${MAX_MEDIA} files` : 'Attach images or videos'}
                                    style={{ padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${cat.accent}40`, background: cat.light, color: cat.accent, fontSize: 13, fontWeight: 600, cursor: mediaFiles.length >= MAX_MEDIA ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: mediaFiles.length >= MAX_MEDIA ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                    {mediaFiles.length > 0 ? `${mediaFiles.length}/${MAX_MEDIA}` : 'Photo/Video'}
                                </button>

                                <button onClick={handlePost} disabled={posting} style={{ padding: '9px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: cat.accent, color: '#fff', fontSize: 14, fontWeight: 600, opacity: posting ? .6 : 1 }}>
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>

                            {/* upload hint */}
                            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#94a3b8' }}>
                                Images (JPEG, PNG, GIF, WEBP) and videos (MP4, WEBM, MOV) — max {MAX_MEDIA} files, 50 MB each
                            </p>
                        </div>
                    )}

                    {/* Admin toolbar */}
                    {isAdmin && (
                        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: '#92400e' }}>🛡️ <strong>Admin view</strong> — delete posts, warn/ban users, manage replies, clear reports.</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none', fontSize: 12, color: '#92400e', fontWeight: 500 }}>
                                <div style={{ width: 32, height: 18, borderRadius: 9, position: 'relative', background: showDeleted ? '#ef4444' : '#d1d5db', transition: 'background .2s' }}>
                                    <div style={{ position: 'absolute', top: 2, left: showDeleted ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                                    <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', margin: 0 }} />
                                </div>
                                Show deleted posts
                            </label>
                        </div>
                    )}

                    {/* Feed */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', margin: '0 auto 12px', border: `3px solid ${cat.accent}30`, borderTopColor: cat.accent, animation: 'spin .8s linear infinite' }} />
                            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Loading...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div style={{ background: '#fff', borderRadius: 16, padding: 52, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>{cat.icon}</div>
                            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>No posts yet in <strong>{category}</strong>. Be the first to share!</p>
                        </div>
                    ) : posts.map(post => {
                        const name        = authorName(post);
                        const avatar      = post.isAnonymous ? null : (post.userId?.avatar || post.userId?.profilePicture);
                        const authorId    = post.userId?._id;
                        const isBanned    = post.userId?.isBannedFromForum;
                        const warnCount   = post.userId?.forumWarningCount || 0;
                        const isDeleted   = !!post.deletedAt;
                        const isFlagged   = post.isFlagged;
                        const repliesOpen = !!expanded[post._id];
                        const hasReported = !!reported[post._id];

                        return (
                            <article key={post._id} style={{ background: isDeleted ? '#fef2f2' : '#fff', borderRadius: 16, marginBottom: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)', opacity: isDeleted ? 0.75 : 1 }}>
                                <div style={{ height: 3, background: isFlagged ? '#ef4444' : cat.accent }} />
                                {isFlagged && isAdmin && (
                                    <div style={{ background: '#fef2f2', padding: '6px 20px', fontSize: 12, color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>🚩 Flagged — {post.reportCount} report{post.reportCount !== 1 ? 's' : ''}</span>
                                        <button onClick={() => handleDismissReports(post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}>Dismiss reports</button>
                                    </div>
                                )}
                                {isDeleted && isAdmin && (
                                    <div style={{ background: '#fef2f2', padding: '6px 20px', fontSize: 12, color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>🗑️ Deleted — {post.deleteReason}</span>
                                        <button onClick={() => handleRestore(post._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}>Restore</button>
                                    </div>
                                )}

                                <div style={{ padding: '20px 22px' }}>
                                    {/* post header */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                            <Avatar src={avatar} name={name} size={44} accent={cat.accent} isAnon={post.isAnonymous} />
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{name}</span>
                                                    {post.isAnonymous && <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>ANON</span>}
                                                    {isAdmin && isBanned && <span style={{ fontSize: 10, background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>BANNED</span>}
                                                    {isAdmin && warnCount > 0 && <span style={{ fontSize: 10, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>⚠️ {warnCount}</span>}
                                                </div>
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(post.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: cat.light, color: cat.accent, fontWeight: 500 }}>{cat.icon} {category}</span>
                                            {isOwner(post) && !isDeleted && (
                                                <button onClick={() => handleDeleteOwn(post._id)} title="Delete post" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 5, borderRadius: 7, display: 'flex', alignItems: 'center' }}>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                                </button>
                                            )}
                                            {isAdmin && (
                                                <div style={{ position: 'relative' }} ref={el => dropRef.current[post._id] = el}>
                                                    <button onClick={() => setAdminOpen(p => ({ ...p, [post._id]: !p[post._id] }))} style={{ padding: '5px 9px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, border: `1px solid ${adminOpen[post._id] ? '#fde68a' : 'transparent'}`, background: adminOpen[post._id] ? '#fef3c7' : 'none', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        🛡️ <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                                                    </button>
                                                    {adminOpen[post._id] && (
                                                        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 200, background: '#fff', borderRadius: 12, minWidth: 210, boxShadow: '0 8px 32px rgba(0,0,0,.14)', border: '1px solid #f1f5f9', padding: 6 }}>
                                                            {!isDeleted && <AdminItem icon="🗑️" label="Remove post" color="#ef4444" onClick={() => { setAdminOpen({}); setModal({ type: 'adminDelete', postId: post._id }); }} />}
                                                            {isDeleted  && <AdminItem icon="♻️" label="Restore post" color="#10b981" onClick={() => { setAdminOpen({}); handleRestore(post._id); }} />}
                                                            {isFlagged  && <AdminItem icon="✅" label="Dismiss reports" color="#6366f1" onClick={() => { setAdminOpen({}); handleDismissReports(post._id); }} />}
                                                            {!post.isAnonymous && (<>
                                                                <AdminItem icon="⚠️" label="Warn user" color="#f59e0b" onClick={() => { setAdminOpen({}); setModal({ type: 'warn', postId: post._id }); }} />
                                                                {isBanned ? <AdminItem icon="✅" label="Unban user" color="#10b981" onClick={() => { setAdminOpen({}); handleUnban(authorId); }} /> : <AdminItem icon="🚫" label="Ban from forum" color="#ef4444" onClick={() => { setAdminOpen({}); setModal({ type: 'ban', postId: post._id, userId: authorId }); }} />}
                                                            </>)}
                                                            {post.isAnonymous && <div style={{ padding: '7px 12px', fontSize: 11, color: '#94a3b8' }}>Warn/ban unavailable for anonymous posts</div>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* post body */}
                                    <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{post.title}</h2>
                                    <p style={{ margin: '0 0 12px', fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{post.description}</p>

                                    {/* ── Media gallery ── */}
                                    <MediaGallery media={post.media} />

                                    {/* tags */}
                                    {post.tags?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                                            {post.tags.map((t, i) => <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569', fontWeight: 500 }}>#{t}</span>)}
                                        </div>
                                    )}

                                    {/* action bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderTop: '1px solid #f1f5f9', paddingTop: 10, flexWrap: 'wrap' }}>
                                        <ActionBtn icon={<svg width="15" height="15" viewBox="0 0 24 24" fill={post.hasSupported ? cat.accent : 'none'} stroke={post.hasSupported ? cat.accent : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>} label={`${post.supportCount || 0} support`} active={post.hasSupported} color={cat.accent} onClick={() => handleSupport(post._id)} disabled={isDeleted} />
                                        <ActionBtn icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>} label={`${post.replies?.length || 0} replies`} active={repliesOpen} color={cat.accent} onClick={() => setExpanded(p => ({ ...p, [post._id]: !p[post._id] }))} />
                                        {user && !isOwner(post) && !isAdmin && !isDeleted && (
                                            <ActionBtn icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>} label={hasReported ? 'Reported' : 'Report'} active={hasReported} color="#ef4444" onClick={() => !hasReported && setModal({ type: 'report', postId: post._id })} disabled={hasReported} />
                                        )}
                                        {isAdmin && post.reportCount > 0 && <span style={{ marginLeft: 'auto', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>🚩 {post.reportCount} report{post.reportCount !== 1 ? 's' : ''}</span>}
                                    </div>

                                    {/* replies */}
                                    {repliesOpen && (
                                        <div style={{ marginTop: 16 }}>
                                            {user && !isDeleted && (
                                                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                                                    <Avatar src={replyAnon[post._id] ? null : user?.avatar} name={user?.fullName} size={32} accent={cat.accent} isAnon={replyAnon[post._id]} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                                            <textarea rows={2} placeholder="Write a supportive reply..." value={replyText[post._id] || ''} onChange={e => setReplyText(r => ({ ...r, [post._id]: e.target.value }))}
                                                                style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', color: '#0f172a' }} />
                                                            <button onClick={() => handleReply(post._id)} style={{ alignSelf: 'flex-end', padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: cat.accent, color: '#fff', fontSize: 13, fontWeight: 600 }}>Reply</button>
                                                        </div>
                                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none', fontSize: 12, color: '#64748b' }}>
                                                            <input type="checkbox" checked={replyAnon[post._id] || false} onChange={e => setReplyAnon(r => ({ ...r, [post._id]: e.target.checked }))} />
                                                            🎭 Reply anonymously
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                            {post.replies?.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    {post.replies.map((r, ri) => {
                                                        const rName   = replyAuthor(r);
                                                        const rAvatar = r.isAnonymous ? null : (r.userId?.avatar || r.userId?.profilePicture);
                                                        const isDelR  = !!r.deletedAt;
                                                        return (
                                                            <div key={r._id || ri} style={{ display: 'flex', gap: 10, padding: '11px 14px', background: isDelR ? '#fef2f2' : '#f8fafc', borderRadius: 11, opacity: isDelR ? 0.7 : 1 }}>
                                                                <Avatar src={rAvatar} name={rName} size={28} accent={cat.accent} isAnon={r.isAnonymous} />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                                            <span style={{ fontWeight: 600, fontSize: 12, color: '#0f172a' }}>{rName}</span>
                                                                            {r.isAnonymous && <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 20, fontWeight: 600 }}>ANON</span>}
                                                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(r.createdAt)}</span>
                                                                            {isAdmin && isDelR && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>DELETED</span>}
                                                                        </div>
                                                                        {isAdmin && !isDelR && r._id && (
                                                                            <div style={{ position: 'relative' }} ref={el => rdropRef.current[r._id] = el}>
                                                                                <button onClick={() => setReplyAdminOpen(p => ({ ...p, [r._id]: !p[r._id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', borderRadius: 6, fontSize: 11 }}>...</button>
                                                                                {replyAdminOpen[r._id] && (
                                                                                    <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 300, background: '#fff', borderRadius: 10, minWidth: 150, boxShadow: '0 6px 24px rgba(0,0,0,.14)', border: '1px solid #f1f5f9', padding: 4 }}>
                                                                                        <AdminItem icon="🗑️" label="Delete reply" color="#ef4444" onClick={() => { setReplyAdminOpen({}); setModal({ type: 'adminDeleteReply', postId: post._id, replyId: r._id }); }} />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p style={{ margin: 0, fontSize: 13, color: isDelR ? '#94a3b8' : '#374151', lineHeight: 1.6, fontStyle: isDelR ? 'italic' : 'normal' }}>
                                                                        {isDelR && !isAdmin ? '[This reply was removed by a moderator]' : r.content}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}

                    {/* community guidelines */}
                    <div style={{ marginTop: 32, background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,.04)', display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 18 }}>🌱</span>
                        <div>
                            <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>Community guidelines</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Be kind and supportive. No hate speech, harmful advice, or personal attacks. Posts are monitored. 3 user reports auto-flag a post for admin review. Users who receive 3 warnings are automatically suspended from the forum.</p>
                        </div>
                    </div>
                </main>

                {/* RIGHT sidebar */}
                <aside style={{ position: 'sticky', top: 20 }}>
                    <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>More Counsellors</p>
                    {RIGHT_ADS.map((ad, i) => <CounsellorAd key={i} ad={ad} />)}
                    <AdvertiseCard accent={cat.accent} />
                </aside>

            </div>

            {/* Modals */}
            {modal?.type === 'report'       && <ReasonModal title="Report this post"     subtitle="Reports are anonymous. Our team will review within 24 hours." placeholder="What is wrong with this post? (e.g. harmful advice, hate speech, spam)" confirmLabel="Submit Report" danger={false} onConfirm={handleReportConfirm}      onCancel={() => setModal(null)} />}
            {modal?.type === 'adminDelete'  && <ReasonModal title="Remove this post"     subtitle="The post will be soft-deleted. You can restore it later from the admin view." placeholder="Reason for removal..." confirmLabel="Remove Post"     danger={true}  onConfirm={handleAdminDeleteConfirm} onCancel={() => setModal(null)} />}
            {modal?.type === 'warn'         && <ReasonModal title="Issue a warning"      subtitle="Warning will be recorded. After 3 warnings the user is automatically banned." placeholder="Reason (e.g. inappropriate language, misinformation)..." confirmLabel="Issue Warning" danger={false} onConfirm={handleWarnConfirm} onCancel={() => setModal(null)} />}
            {modal?.type === 'ban'          && <ReasonModal title="Ban user from forum"  placeholder="Reason for ban..." confirmLabel="Ban User" danger={true} onConfirm={handleBanConfirm} onCancel={() => setModal(null)} />}
            {modal?.type === 'adminDeleteReply' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setModal(null)}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Delete this reply?</h3>
                        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>The reply will be hidden from users but visible to admins as deleted.</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setModal(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}>Cancel</button>
                            <button onClick={handleAdminDeleteReplyConfirm} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', background: '#ef4444' }}>Delete Reply</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
}
