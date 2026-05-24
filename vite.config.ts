import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isProd = mode === 'prod' || mode === 'production'

  return {
    plugins: [
      vue(),
      vueDevTools(),
      Components({
        dts: 'src/types/components.d.ts',
        resolvers: [
          ArcoResolver({
            sideEffect: true, // 自动导入对应组件样式
            // 默认 importStyle: 'css'，与全量 arco.css 行为一致；
            // 之后若改用 less 主题定制，可改为 'less'
          }),
        ],
        // 自动按需注册业务组件（src/components/**），免去手动 import
        dirs: ['src/components'],
        extensions: ['vue'],
      }),
    ],
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./', import.meta.url)),
        '@': path.resolve(__dirname, 'src'),
        'vue': 'vue/dist/vue.esm-bundler.js'
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    server: {
      port: Number(env.VITE_PORT) || 8088,
      host: env.VITE_HOST === 'true',
      open: env.VITE_OPEN === 'true',
      proxy: env.VITE_PROXY_ENABLED === 'true' ? {
        [env.VITE_API_PREFIX]: {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${env.VITE_API_PREFIX}`), '')
        }
      } : undefined
    },
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME)
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: !isProd,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          // 分包策略：
          //  - arco / vue-vendor / vendor 都是同步首屏依赖，聚合成稳定 chunk 利于长缓存
          //  - echarts 不在这里聚合 —— 让它跟随业务的动态 import 自然切分，
          //    在 src/utils/echarts/lazy.ts 中按需 use() 后，未注册的图表类型会被 tree-shake 掉
          //  - views 仅聚合页面级 .vue 文件，子组件不进 views chunk（保持各 view 之间懒加载）
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('echarts') || id.includes('zrender')) {
                // 返回 undefined → 走默认按 import 关系分包；
                // 这样 echarts 跟随 dashboard 的 await import 进入一个异步 chunk
                return undefined
              }
              if (id.includes('@arco-design')) return 'arco'
              if (id.includes('vue') || id.includes('pinia')) return 'vue-vendor'
              return 'vendor'
            }
            if (id.includes('/src/views/')) return 'views'
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    esbuild: {
      // 生产构建移除 console / debugger（默认压缩器是 esbuild，terserOptions 不会生效）
      drop: isProd ? ['console', 'debugger'] : [],
      supported: { 'top-level-await': true },
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    }
  }
})
