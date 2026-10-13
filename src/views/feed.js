/**
 * feed.js — Community feed view.
 *
 * Displays a list of community posts (newest first), a post-creation card,
 * and per-post like/delete actions.
 *
 * @module views/feed
 */

import { store } from '../store.js';
import { auth } from '../auth.js';
import { router } from '../router.js';
import {
  el,
  card,
  avatar,
  badge,
  emptyState,
  errorState,
} from '../ui.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Return a human-readable relative timestamp string.
 * e.g. "2 hours ago", "3 days ago", "just now"
 *
 * @param {string} isoDate - ISO-8601 date string
 * @returns {string}
 */
function relativeTime(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Parse a comma-separated tag string into a clean array.
 *
 * @param {string} raw - e.g. "fundraising, education, health"
 * @returns {string[]}
 */
function parseTags(raw) {
  return raw
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
}

// ─── Post card renderer ────────────────────────────────────────────────────

/**
 * Build a single post card element.
 *
 * @param {object} post - Post object from the store
 * @param {object} author - User object for the post author
 * @param {string} currentUserId - ID of the logged-in user
 * @param {Function} onLike - Called with (postId) when like is toggled
 * @param {Function} onDelete - Called with (postId) when delete is confirmed
 * @returns {HTMLElement}
 */
function buildPostCard(post, author, currentUserId, onLike, onDelete) {
  const isOwn = post.authorId === currentUserId;
  const liked = (post.likes || []).includes(currentUserId);
  const likeCount = (post.likes || []).length;

  // Author header
  const authorAvatar = avatar(author || { displayName: '?' });
  const authorName = el(
    'a',
    {
      class: 'vm-post__author-name',
      href: `#/profile/${author ? author.username : ''}`,
      'aria-label': `View ${author ? author.displayName : 'unknown'} profile`,
    },
    author ? author.displayName : 'Unknown User'
  );
  const authorHandle = el(
    'span',
    { class: 'vm-post__author-handle' },
    `@${author ? author.username : '?'}`
  );
  const authorMeta = el('div', { class: 'vm-post__author-meta' }, authorName, authorHandle);
  const timestamp = el(
    'time',
    {
      class: 'vm-post__timestamp',
      dateTime: post.createdAt,
      title: post.createdAt,
    },
    relativeTime(post.createdAt)
  );
  const header = el(
    'div',
    { class: 'vm-post__header' },
    authorAvatar,
    authorMeta,
    timestamp
  );

  // Post body
  const body = el('p', { class: 'vm-post__text' }, post.text || '');

  // Tags
  const tags = (post.tags || []).map(t => badge(t, 'tag'));
  const tagsRow = el('div', { class: 'vm-post__tags' }, ...tags);

  // Like button
  const likeBtn = el(
    'button',
    {
      class: `vm-post__action btn ${liked ? 'btn-primary' : 'btn-secondary'}`,
      'aria-label': liked ? 'Unlike this post' : 'Like this post',
      'aria-pressed': String(liked),
      onClick: () => onLike(post.id),
    },
    `${liked ? '❤️' : '🤍'} ${likeCount}`
  );

  // Delete button (only for own posts)
  const actions = el('div', { class: 'vm-post__actions' }, likeBtn);
  if (isOwn) {
    const deleteBtn = el(
      'button',
      {
        class: 'vm-post__action btn btn-danger',
        'aria-label': 'Delete this post',
        onClick: () => onDelete(post.id),
      },
      '🗑️ Delete'
    );
    actions.appendChild(deleteBtn);
  }

  return card(header, body, tagsRow, actions);
}

// ─── Create-post form ─────────────────────────────────────────────────────

/**
 * Build the compose / create-post card.
 *
 * @param {object} currentUser - Logged-in user object
 * @param {Function} onPost - Called with (text, tags) when form is submitted
 * @returns {HTMLElement}
 */
function buildCreatePostCard(currentUser, onPost) {
  const userAvatar = avatar(currentUser);

  const textarea = el('textarea', {
    class: 'vm-post__compose-textarea',
    placeholder: 'Share a community update…',
    rows: '3',
    'aria-label': 'New post text',
    maxLength: 1000,
  });

  const tagsInput = el('input', {
    class: 'vm-post__compose-tags',
    type: 'text',
    placeholder: 'Tags: fundraising, education…',
    'aria-label': 'Post tags (comma-separated)',
  });

  const errorEl = el('p', {
    class: 'error-message',
    role: 'alert',
    id: 'post-compose-error',
  });

  const submitBtn = el(
    'button',
    {
      class: 'btn btn-primary',
      type: 'submit',
      'aria-label': 'Publish post',
    },
    '📢 Post'
  );

  const form = el(
    'form',
    {
      class: 'vm-post__compose-form',
      'aria-label': 'Create a new post',
      onSubmit: (e) => {
        e.preventDefault();
        const text = textarea.value.trim();
        errorEl.textContent = '';
        if (!text) {
          errorEl.textContent = 'Post text cannot be empty.';
          textarea.focus();
          return;
        }
        const tags = parseTags(tagsInput.value);
        onPost(text, tags);
        textarea.value = '';
        tagsInput.value = '';
      },
    },
    textarea,
    tagsInput,
    errorEl,
    submitBtn
  );

  const composeArea = el('div', { class: 'vm-post__compose-area' }, userAvatar, form);
  return card(composeArea);
}

// ─── View entry point ─────────────────────────────────────────────────────

/**
 * Render the community feed view.
 *
 * @param {HTMLElement} container - The #view-root element
 * @param {object} _params - Route params (unused)
 * @returns {Function} Cleanup function
 */
export default async function renderFeed(container, _params) {
  // Auth guard — redirect to /landing if not logged in
  auth.requireAuth();

  const currentUser = auth.currentUser();
  if (!currentUser) {
    container.innerHTML = '';
    container.appendChild(errorState('You must be logged in to view the feed.'));
    return () => {};
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  /** Toggle like on a post: add or remove currentUser.id from post.likes */
  function handleLike(postId) {
    const posts = store.get('posts') || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const likes = post.likes || [];
    const alreadyLiked = likes.includes(currentUser.id);
    const newLikes = alreadyLiked
      ? likes.filter(id => id !== currentUser.id)
      : [...likes, currentUser.id];

    store.patch('posts', postId, { likes: newLikes });
    renderView(); // Re-render to reflect new like count
  }

  /** Remove a post from the store (only allowed for own posts) */
  function handleDelete(postId) {
    const posts = store.get('posts') || [];
    const post = posts.find(p => p.id === postId);
    if (!post || post.authorId !== currentUser.id) return;

    const confirmed = window.confirm('Delete this post? This cannot be undone.');
    if (!confirmed) return;

    store.set('posts', posts.filter(p => p.id !== postId));
    renderView();
  }

  /** Create a new post and prepend it to the store */
  function handleCreatePost(text, tags) {
    const newPost = {
      id: `p_${Date.now()}`,
      authorId: currentUser.id,
      text,
      tags,
      likes: [],
      createdAt: new Date().toISOString(),
    };
    const existing = store.get('posts') || [];
    store.set('posts', [newPost, ...existing]);
    renderView();
  }

  // ── Renderer ──────────────────────────────────────────────────────────────

  /** Rebuild the entire view content */
  function renderView() {
    container.innerHTML = '';

    const users = store.get('users') || [];
    const posts = [...(store.get('posts') || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Page heading
    const heading = el(
      'h1',
      { class: 'vm-view-title' },
      '🏠 Community Feed'
    );
    container.appendChild(heading);

    // Create-post card
    container.appendChild(buildCreatePostCard(currentUser, handleCreatePost));

    // Post list or empty state
    if (posts.length === 0) {
      container.appendChild(
        emptyState(
          '📭',
          'No posts yet',
          'Be the first to share a community update.',
          null,
          null
        )
      );
      return;
    }

    for (const post of posts) {
      const author = users.find(u => u.id === post.authorId) || null;
      const postCard = buildPostCard(
        post,
        author,
        currentUser.id,
        handleLike,
        handleDelete
      );
      postCard.dataset.postId = post.id;
      container.appendChild(postCard);
    }
  }

  renderView();

  // No persistent event listeners outside the DOM — cleanup is a no-op
  return function cleanup() {};
}
