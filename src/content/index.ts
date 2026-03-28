import { shouldBlock } from './filter'
import { loadStore, incrementStat } from '../shared/storage'
import type { FilterStore } from '../shared/types'
import { BOT_BLOCKED } from '../shared/types'

const COMMENT_SELECTOR = 'ytd-comment-view-model, ytd-comment-renderer'
const PINNED_BADGE_SELECTOR = '#pinned-comment-badge, ytd-pinned-comment-badge-renderer'
const COMMENTS_CONTAINER_SELECTOR = 'ytd-comments #sections #contents'
const PLACEHOLDER_ATTR = 'data-ytf-placeholder'

let store: FilterStore | null = null
let activeObserver: MutationObserver | null = null

// ── Styles ────────────────────────────────────────────────────────────────────

function injectStyles(): void {
  if (document.getElementById('ytf-styles')) return
  const style = document.createElement('style')
  style.id = 'ytf-styles'
  style.textContent = `
    [data-ytf-placeholder] {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 14px;
      margin: 2px 0 6px;
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.04);
      border-left: 3px solid #cc0000;
      font-size: 13px;
      color: #777;
      box-sizing: border-box;
    }
    html[dark] [data-ytf-placeholder],
    ytd-app[is-dark-theme] [data-ytf-placeholder] {
      background: rgba(255, 255, 255, 0.06);
      color: #aaa;
    }
    [data-ytf-placeholder] .ytf-icon {
      font-style: normal;
      font-size: 14px;
      flex-shrink: 0;
    }
    [data-ytf-placeholder] .ytf-reason {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    [data-ytf-placeholder] .ytf-expand {
      flex-shrink: 0;
      padding: 3px 11px;
      border-radius: 14px;
      border: 1px solid #ccc;
      background: transparent;
      color: #555;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    html[dark] [data-ytf-placeholder] .ytf-expand,
    ytd-app[is-dark-theme] [data-ytf-placeholder] .ytf-expand {
      border-color: #555;
      color: #aaa;
    }
    [data-ytf-placeholder] .ytf-expand:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  `
  document.head.appendChild(style)
}

// ── Blind / Unblind ───────────────────────────────────────────────────────────

function reasonLabel(_blockedBy: string): string {
  return '필터링 된 댓글입니다'
}

function blindComment(el: HTMLElement, blockedBy: string): void {
  el.style.display = 'none'
  el.dataset.blockedBy = blockedBy

  const placeholder = document.createElement('div')
  placeholder.setAttribute(PLACEHOLDER_ATTR, '1')

  const icon = document.createElement('i')
  icon.className = 'ytf-icon'
  icon.textContent = '🚫'

  const reason = document.createElement('span')
  reason.className = 'ytf-reason'
  reason.textContent = reasonLabel(blockedBy)   // textContent — XSS-safe

  const btn = document.createElement('button')
  btn.className = 'ytf-expand'
  btn.type = 'button'
  btn.textContent = '펼쳐보기'
  btn.addEventListener('click', () => {
    // User explicitly expanded — don't re-blind even on processExisting re-runs
    el.dataset.userExpanded = '1'
    delete el.dataset.blockedBy
    el.style.display = ''
    placeholder.remove()
  })

  placeholder.appendChild(icon)
  placeholder.appendChild(reason)
  placeholder.appendChild(btn)
  el.parentElement?.insertBefore(placeholder, el)
}

function unblindComment(el: HTMLElement): void {
  el.style.display = ''
  delete el.dataset.blockedBy
  // Remove the sibling placeholder (inserted just before the comment)
  const prev = el.previousElementSibling as HTMLElement | null
  if (prev?.hasAttribute(PLACEHOLDER_ATTR)) prev.remove()
}

// ── Core processing ───────────────────────────────────────────────────────────

function processComment(el: HTMLElement): void {
  if (!store) return

  // Protect pinned comments
  if (store.settings.protectPinnedComment && el.querySelector(PINNED_BADGE_SELECTOR)) {
    return
  }

  // User manually expanded this comment — respect that choice
  if (el.dataset.userExpanded) return

  const text = el.querySelector('#content-text')?.textContent ?? ''
  const nickname = el.querySelector('#author-text')?.textContent?.trim() ?? ''

  const blockedBy = shouldBlock(text, nickname, store)
  const wasBlocked = el.dataset.blockedBy !== undefined

  if (blockedBy) {
    if (!wasBlocked) {
      blindComment(el, blockedBy)
      incrementStat(blockedBy)
    }
  } else if (wasBlocked) {
    unblindComment(el)
  }
}

function processExisting(): void {
  document.querySelectorAll<HTMLElement>(COMMENT_SELECTOR).forEach(processComment)
}

// ── Observer ──────────────────────────────────────────────────────────────────

function startTargetedObserver(): boolean {
  const container = document.querySelector(COMMENTS_CONTAINER_SELECTOR)
  if (!container) return false

  activeObserver?.disconnect()
  activeObserver = new MutationObserver((mutations) => {
    requestIdleCallback(() => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.matches(COMMENT_SELECTOR)) {
            processComment(node)
          } else {
            node.querySelectorAll<HTMLElement>(COMMENT_SELECTOR).forEach(processComment)
          }
        }
      }
    })
  })
  activeObserver.observe(container, { childList: true, subtree: true })
  return true
}

function observeComments(): void {
  if (startTargetedObserver()) return

  const rootObserver = new MutationObserver((_, obs) => {
    if (startTargetedObserver()) obs.disconnect()
  })
  rootObserver.observe(document.body, { childList: true, subtree: true })
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  injectStyles()
  store = await loadStore()
  processExisting()
  observeComments()

  document.addEventListener('yt-navigate-finish', () => {
    activeObserver?.disconnect()
    activeObserver = null
    setTimeout(() => {
      processExisting()
      observeComments()
    }, 1000)
  })

  chrome.storage.onChanged.addListener(async () => {
    store = await loadStore()
    processExisting()
  })
}

init()
