import { onMounted } from 'vue'
import { defineClientConfig } from 'vuepress/client'

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    onMounted(() => {
      // Log to confirm the event listener is set up
      console.log("Ctrl+K event listener is active.");

      // Listen for the 'Ctrl + K' keyboard event
      document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'k') {
          event.preventDefault(); // Prevent default browser search behavior
          console.log('Ctrl + K pressed');

          // Find the search input element (using multiple potential selectors)
          const searchInput = document.querySelector('.vp-search input') 
            || document.querySelector('input.search__input')
            || document.querySelector('.search input'); // Add more selectors if needed

          if (searchInput) {
            console.log('Focusing on search input');
            searchInput.focus(); // Focus the search input
          } else {
            console.error('Search input not found!');
          }
        }
      })
    })
  },
  setup() {},
  rootComponents: [],
})
