import { mount } from 'svelte'
import App from './App.svelte'

const target = document.getElementById('app')

if (target === null) {
  throw new Error('Mount target #app is missing from the document')
}

mount(App, { target })
