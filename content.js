const Hostname = location.hostname

let CounterDiv = null
let ResetBtn = null
let CounterInterval = null

function CreateCounter() {
  if (!CounterDiv) {
    CounterDiv = document.createElement("div")
    CounterDiv.id = "time-counter-overlay"
    document.body.appendChild(CounterDiv)
  }
}

function RemoveCounter() {
  if (CounterDiv) {
    CounterDiv.remove()
    CounterDiv = null
  }
}

function ShowResetButton() {
  if (!ResetBtn) {
    ResetBtn = document.createElement("div")
    ResetBtn.id = "time-reset-btn"
    ResetBtn.textContent = "×"
    document.body.appendChild(ResetBtn)
    ResetBtn.onclick = async () => {
      await browser.runtime.sendMessage({action: "closeBlockMessage", hostname: Hostname})
    }
  }
}

function RemoveResetButton() {
  if (ResetBtn) {
    ResetBtn.remove()
    ResetBtn = null
  }
}

function ShowWarning() {
  let Warn = document.getElementById("time-warning-overlay")
  if (!Warn) {
    Warn = document.createElement("div")
    Warn.id = "time-warning-overlay"
    Warn.textContent = "⚠ Time limit exceeded!"
    document.body.appendChild(Warn)
  }
}

function RemoveWarning() {
  const Warn = document.getElementById("time-warning-overlay")
  if (Warn) Warn.remove()
}

// Only update counter if tab is visible
async function UpdateCounter() {
  if (document.hidden) return // skip if tab not active

  try {
    const Resp = await browser.runtime.sendMessage({action: "getTime", hostname: Hostname})
    if (!Resp) return

    const Seconds = Resp.seconds || 0
    const Threshold = Resp.threshold || null

    if (!Threshold) {
      RemoveCounter()
      RemoveWarning()
      RemoveResetButton()
      return
    }

    CreateCounter()
    const Minutes = Math.floor(Seconds / 60)
    CounterDiv.textContent = `Time: ${Seconds}s (${Minutes} min)`

    if (Seconds >= Threshold) {
      ShowWarning()
      ShowResetButton()
    } else {
      RemoveWarning()
      RemoveResetButton()
    }
  } catch (e) {}
}

// Run every second, but only counts if tab is visible
CounterInterval = setInterval(UpdateCounter, 1000)

// Also update immediately on load
UpdateCounter()

// Optional: immediately update when user switches back to tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) UpdateCounter()
})
