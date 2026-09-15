import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Send, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  X, 
  CornerDownRight, 
  MoreVertical,
  Shield,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  subscribeForumPosts, 
  createForumPost, 
  toggleLikePost, 
  deleteForumPost,
  subscribeComments,
  addComment,
  deleteComment,
  uploadImageFile 
} from '../firebase/services';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/LoadingSkeleton';

function PostItem({ post, currentUser, userProfile, isAdmin }) {
  const toast = useToast();
  const [likes, setLikes] = useState(post.likes || []);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState((post.likes || []).includes(currentUser?.uid || userProfile?.uid));

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Sync state if post updates
  useEffect(() => {
    setLikes(post.likes || []);
    setLikesCount(post.likesCount || 0);
    setHasLiked((post.likes || []).includes(currentUser?.uid || userProfile?.uid));
  }, [post, currentUser, userProfile]);

  useEffect(() => {
    if (!showComments) return;
    const unsub = subscribeComments(post.id, (list) => {
      setComments(list);
    });
    return () => unsub();
  }, [post.id, showComments]);

  const handleLike = async () => {
    const uid = currentUser?.uid || userProfile?.uid;
    if (!uid) return;

    // Optimistic update
    if (hasLiked) {
      setHasLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      setHasLiked(true);
      setLikesCount(prev => prev + 1);
    }

    try {
      await toggleLikePost(post.id, uid);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Hapus postingan ini dari forum?')) return;
    try {
      await deleteForumPost(post.id);
      toast.success('Postingan berhasil dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus: ' + e.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment({
        postId: post.id,
        content: newComment,
        authorId: currentUser?.uid || userProfile?.uid,
        authorName: userProfile?.fullName || 'Warga GP4',
        authorPhoto: userProfile?.photoUrl || '',
      });
      setNewComment('');
    } catch (e) {
      toast.error('Gagal mengirim komentar: ' + e.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId, post.id);
      toast.success('Komentar dihapus.');
    } catch (e) {
      toast.error('Gagal menghapus komentar: ' + e.message);
    }
  };

  const isAuthor = post.authorId === (currentUser?.uid || userProfile?.uid);
  const canDelete = isAuthor || isAdmin;

  const formatDate = (val) => {
    if (!val) return 'Baru saja';
    try {
      const d = val?.toDate ? val.toDate() : new Date(val);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner overflow-hidden">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              post.authorName?.charAt(0) || 'W'
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-sm">{post.authorName}</span>
              {post.authorHouse && (
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {post.authorHouse}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {canDelete && (
          <button
            onClick={handleDeletePost}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title={isAdmin && !isAuthor ? "Moderasi (Hapus Post)" : "Hapus Postingan"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Text */}
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Post Image */}
      {post.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-96">
          <img src={post.imageUrl} alt="" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Action Bar (Like & Comments trigger) */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            hasLiked
              ? 'text-rose-600 bg-rose-50 font-bold'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
          <span>{likesCount} Suka</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{post.commentCount || comments.length || 0} Komentar</span>
        </button>
      </div>

      {/* Expandable Comments */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/60 p-4 rounded-2xl">
          {/* Comments List */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada tanggapan. Jadilah yang pertama berkomentar!</p>
            ) : (
              comments.map((c) => {
                const canDeleteComment = c.authorId === (currentUser?.uid || userProfile?.uid) || isAdmin;
                return (
                  <div key={c.id} className="flex items-start justify-between gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {c.authorName?.charAt(0) || 'W'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 mr-1.5">{c.authorName}</span>
                        <p className="text-slate-600 mt-0.5 leading-snug">{c.content}</p>
                      </div>
                    </div>
                    {canDeleteComment && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Tulis tanggapan santun..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ForumPage() {
  const { userProfile, currentUser, isAdmin } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Post state
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeForumPosts((list) => {
      setPosts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) {
      toast.warning('Tuliskan sesuatu untuk diposting.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = '';
      if (selectedFile) {
        imageUrl = await uploadImageFile(selectedFile, 'forum');
      }

      await createForumPost({
        content,
        imageUrl,
        authorId: currentUser?.uid || userProfile?.uid,
        authorName: userProfile?.fullName || 'Warga GP4',
        authorHouse: userProfile?.block ? `Blok ${userProfile.block}-${userProfile.houseNumber}` : 'GP4',
        authorPhoto: userProfile?.photoUrl || '',
      });

      setContent('');
      setSelectedFile(null);
      setPreviewUrl('');
      toast.success('Postingan berhasil dibagikan di Forum Warga!');
    } catch (e) {
      toast.error('Gagal membuat postingan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header info */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ruang Diskusi & Silaturahmi</span>
          </div>
          <h1 className="text-xl font-black text-slate-800">Forum Warga GP4</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Berbagi informasi, tanya jawab tetangga, jual-beli, dan obrolan hangat antarwarga.
          </p>
        </div>
      </div>

      {/* Create New Post Box */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-inner shrink-0 overflow-hidden">
            {userProfile?.photoUrl ? (
              <img src={userProfile.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              userProfile?.fullName?.charAt(0) || 'W'
            )}
          </div>
          <div className="flex-1">
            <textarea
              rows={3}
              placeholder={`Halo ${userProfile?.fullName || 'Warga'}, ada yang ingin dibagikan ke tetangga hari ini?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-xs sm:text-sm bg-slate-50 p-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Selected Image Preview */}
        {previewUrl && (
          <div className="relative inline-block ml-13">
            <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
              className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full shadow-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>Tambah Foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleCreatePost}
            disabled={submitting || (!content.trim() && !selectedFile)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Mengirim...' : 'Posting'}</span>
          </button>
        </div>
      </div>

      {/* Forum Feed */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Forum Masih Sepi"
          description="Belum ada obrolan di forum. Mulailah menyapa tetangga komplek Anda sekarang!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              currentUser={currentUser}
              userProfile={userProfile}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
