import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// W buildzie produkcyjnym base = nazwa repozytorium: aplikacja jest serwowana z
// https://adrian2131.github.io/plan-sto-y/. W trybie dev zostaje '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/plan-sto-y/' : '/',
  plugins: [react()],
}))
