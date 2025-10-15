async function LoadSites() {
  const Data = await browser.storage.local.get("TrackedSites")
  const Sites = Data.TrackedSites || []
  const TBody = document.querySelector("#list tbody")
  TBody.innerHTML = ""
  for (const Site of Sites) {
    const Row = document.createElement("tr")
    Row.innerHTML = `
      <td>${Site.domain}</td>
      <td>${Site.threshold}</td>
      <td>${Site.dismiss}</td>
      <td><button data-domain="${Site.domain}">Remove</button></td>
    `
    TBody.appendChild(Row)
  }
}

document.getElementById("set").onclick = async () => {
  const Domain = document.getElementById("domain").value.trim()
  const Threshold = parseInt(document.getElementById("threshold").value)
  const Dismiss = parseInt(document.getElementById("dismiss").value) || 0
  if (!Domain || isNaN(Threshold)) {
    document.getElementById("parametersStatus").textContent = "[ERROR] Domain and Threshold are mandatory."
    return
  }
  if (Dismiss > Threshold || Dismiss < 0 || Threshold < 0) {
    document.getElementById("parametersStatus").textContent = "[ERROR] 0 < Dismiss <= Threshold"
    return
  }
  
  const Data = await browser.storage.local.get("TrackedSites")
  let Sites = Data.TrackedSites || []

  // Check if domain already exists (exact or subdomain match)
  const Index = Sites.findIndex(s => s.domain === Domain)
  if (Index !== -1) {
    Sites[Index].threshold = Threshold // Update existing
    Sites[Index].dismiss = Dismiss // Update existing
  } else {
    Sites.push({ domain: Domain, threshold: Threshold, dismiss: Dismiss }) // Add new
  }
  document.getElementById("parametersStatus").textContent = ""
    
  await browser.storage.local.set({ TrackedSites: Sites })
  await LoadSites()
}

document.querySelector("#list").addEventListener("click", async (e) => {
  if (e.target.tagName === "BUTTON") {
    const Domain = e.target.dataset.domain
    const Data = await browser.storage.local.get("TrackedSites")
    let Sites = Data.TrackedSites || []
    Sites = Sites.filter(s => s.domain !== Domain)
    await browser.storage.local.set({ TrackedSites: Sites })
    await LoadSites()
  }
})

LoadSites()
