import { shouldBlock } from './filter'
import { loadStore, incrementStat } from '../shared/storage'
import type { FilterStore } from '../shared/types'

const COMMENT_SELECTOR = 'ytd-comment-view-model, ytd-comment-renderer'
const PINNED_BADGE_SELECTOR = '#pinned-comment-badge, ytd-pinned-comment-badge-renderer'

let store: FilterStore | null = null

async function init(): Promise<void> {
  store = await loadStore()
  processExisting()
  observeComments()

  // Re-process when navigating to new video (YouTube SPA)
  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(processExisting, 1000) // wait for comments to render
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

function observeComments(): void {
  const observer = new MutationObserver((mutations) => {
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

  observer.observe(document.body, { childList: true, subtree: true })
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

  if (blockedBy) {
    el.style.display = 'none'
    el.dataset.blockedBy = blockedBy
    incrementStat(blockedBy)
  }
}

init()
