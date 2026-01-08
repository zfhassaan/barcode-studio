<script setup>
const runScript = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => alert('Injected from Vue!'),
  })
}
</script>

<template>
  <div class="popup-container">
    <h1>Vue Extension</h1>
    <button @click="runScript">Run</button>
  </div>
</template>

<style scoped>
.popup-container {
  width: 200px;
  padding: 1rem;
  text-align: center;
}
button {
  padding: 0.5rem 1rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #35495e;
}
</style>
