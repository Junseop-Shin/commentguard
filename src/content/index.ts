import { shouldBlock } from './filter'
import { loadStore, incrementStat } from '../shared/storage'
import type { FilterStore } from '../shared/types'

const COMMENT_SELECTOR = 'ytd-comment-view-model, ytd-comment-renderer'
const PINNED_BADGE_SELECTOR = '#pinned-comment-badge, ytd-pinned-comment-badge-renderer'
// Targeted container for comments — much less noisy than document.body
const COMMENTS_CONTAINER_SELECTOR = 'ytd-comments #sections #contents'

let store: FilterStore | null = null
let activeObserver: MutationObserver | null = null

async function init(): Promise<void> {
  store = await loadStore()
  processExisting()
  observeComments()

  // Re-process when navigating to new video (YouTube SPA)
  document.addEventListener('yt-navigate-finish', () => {
    // Disconnect existing observer and re-setup for the new page's comment section
    activeObserver?.disconnect()
    activeObserver = null
    setTimeout(() => {
      processExisting()
      observeComments()
    }, 1000) // wait for comments section to be injected
  })

  // Re-process existing comments when store changes
  chrome.storage.onChanged.addListener(async () => {
    store = await loadStore()
    processExisting()
  })
}

function processExisting(): void {
  document.querySelectorAll<HTMLElement>(COMMENT_SELECTOR).forEach(processComment)
}

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
  // Observe only direct children — comments section adds threads, not deep subtree mutations
  activeObserver.observe(container, { childList: true, subtree: true })
  return true
}

function observeComments(): void {
  // Phase 1: Try to hook directly onto the comments container
  if (startTargetedObserver()) return

  // Phase 2: Comments not loaded yet — watch body temporarily until the container appears
  const rootObserver = new MutationObserver((_, obs) => {
    if (startTargetedObserver()) {
      obs.disconnect()
    }
  })
  rootObserver.observe(document.body, { childList: true, subtree: true })
}

function processComment(el: HTMLElement): void {
  if (!store) return

  // Protect pinned comments
  if (store.settings.protectPinnedComment && el.querySelector(PINNED_BADGE_SELECTOR)) {
    return
  }

  const text = el.querySelector('#content-text')?.textContent ?? ''
  const nickname = el.querySelector('#author-text')?.textContent?.trim() ?? ''

  const blockedBy = shouldBlock(text, nickname, store)
  const wasBlocked = el.dataset.blockedBy !== undefined

  if (blockedBy) {
    el.style.display = 'none'
    el.dataset.blockedBy = blockedBy
    if (!wasBlocked) {
      // Only count on first block — avoids double-counting on processExisting re-runs
      incrementStat(blockedBy)
    }
  } else if (wasBlocked) {
    // Restore comment when filter is disabled or keyword removed
    el.style.display = ''
    delete el.dataset.blockedBy
  }
}

init()
