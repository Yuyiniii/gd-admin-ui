import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router/index'
// 组件样式由 unplugin-vue-components (sideEffect=true) 按需注入；
// 仍引入一次全量 CSS 是为了保证未被解析器命中的指令式组件（如 Message/Modal）
// 也能拿到必要的全局变量与重置样式。
// 在 prod 模式下，未使用到的样式会被 CSS code-split + tree-shake，体积可控。
import '@arco-design/web-vue/dist/arco.css'
import { setupErrorHandler } from '@/utils/errorHandler'
import { setupDirectives } from '@/directives'

const app = createApp(App)

setupErrorHandler(app)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
setupDirectives(app)
app.mount('#app')
