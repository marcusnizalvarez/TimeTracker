// Each hostname stores an array of timestamps (milliseconds since epoch)
async function LoadData() {
  const Data = await browser.storage.local.get("TimeData")
  return Data.TimeData || {}
}

async function SaveData(TimeData) {
  await browser.storage.local.set({ TimeData })
}

async function GetTrackedSites() {
  const Data = await browser.storage.local.get("TrackedSites")
  return Data.TrackedSites || []
}

function PruneOldEntries(Timestamps) {
  // Remove timestamps older than 24h
  const DayAgo = Date.now() - 24 * 3600 * 1000 
  return Timestamps.filter(t => t >= DayAgo)
}

browser.runtime.onMessage.addListener(async (msg, sender) => {
  const Host = msg.hostname
    
  if (msg.action === "getTime") {
    const TrackedSites = await GetTrackedSites()
    const Match = TrackedSites.find(s => Host === s.domain || Host.endsWith(`.${s.domain}`))
    if (!Match) return null  // skip if not registered
  
    let TimeData = await LoadData()
    const Threshold = Match.threshold
    if (!TimeData[Host]) TimeData[Host] = []
    TimeData[Host] = PruneOldEntries(TimeData[Host])
  
    // Stop counting once threshold is reached
    if (TimeData[Host].length >= Threshold) {
      return { seconds: TimeData[Host].length, threshold: Threshold }
    }
  
    // Only add new timestamp if still below threshold
    TimeData[Host].push(Date.now())
    await SaveData(TimeData)
  
    return { seconds: TimeData[Host].length, threshold: Threshold }
  }

  if (msg.action === "closeBlockMessage") {
    const TrackedSites = await GetTrackedSites()
    const Match = TrackedSites.find(s => Host === s.domain || Host.endsWith(`.${s.domain}`))
    if (!Match) return null  // skip if not registered
  
    const TimeReduction = (Match.dismiss ?? 0)
    if (TimeReduction <= 0) return
    
    let TimeData = await LoadData()
    if (!TimeData[Host]) TimeData[Host] = []
    if (TimeData[Host].length === 0) return
    
    if (TimeReduction <= 0) return
    
    // remove oldest entries (from start)
    if (TimeReduction >= TimeData[Host].length) {
      delete TimeData[Host]
    } else {
      TimeData[Host]=TimeData[Host].slice(TimeReduction)
    }
    await SaveData(TimeData)
  }
})
