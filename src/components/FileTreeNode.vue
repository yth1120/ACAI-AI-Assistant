<template>
  <div class="file-tree-node">
    <div
      class="node-content"
      :class="{ active: isActive }"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="handleClick"
    >
      <i
        v-if="isFolder"
        class="folder-icon"
        :class="node.expanded ? 'fa-chevron-down' : 'fa-chevron-right'"
      ></i>
      <i v-else class="file-icon" :class="getFileIcon()"></i>
      <span class="node-name">{{ node.name }}</span>
    </div>
    <div v-if="isFolder && node.expanded && node.children" class="node-children">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :active-id="activeId"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileNode } from '@/stores/code'

interface Props {
  node: FileNode
  depth?: number
  activeId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  activeId: null
})

const emit = defineEmits<{
  select: [node: FileNode]
  toggle: [node: FileNode]
}>()

const isFolder = props.node.type === 'folder'

const isActive = props.activeId === props.node.id

function handleClick() {
  if (isFolder) {
    emit('toggle', props.node)
  } else {
    emit('select', props.node)
  }
}

function getFileIcon(): string {
  const name = props.node.name.toLowerCase()
  if (name.endsWith('.py')) return 'fa-solid fa-file-code text-yellow-400'
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'fa-solid fa-file-code text-yellow-300'
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return 'fa-solid fa-file-code text-blue-400'
  if (name.endsWith('.vue')) return 'fa-solid fa-file-code text-green-400'
  if (name.endsWith('.html')) return 'fa-solid fa-file-code text-orange-400'
  if (name.endsWith('.css') || name.endsWith('.scss')) return 'fa-solid fa-file-code text-cyan-400'
  if (name.endsWith('.json')) return 'fa-solid fa-file-code text-green-300'
  if (name.endsWith('.md')) return 'fa-solid fa-file-text text-blue-300'
  if (name.endsWith('.txt')) return 'fa-solid fa-file-text text-gray-400'
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'fa-solid fa-file-code text-red-400'
  return 'fa-solid fa-file text-dark-muted'
}
</script>

<style scoped>
.file-tree-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease),
              color var(--duration-fast) var(--ease);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.node-content:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.node-content.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.folder-icon {
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--duration-fast) var(--ease);
}

.node-content.active .folder-icon {
  color: var(--color-text-inverse);
}

.file-icon {
  width: 16px;
  height: 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-children {
  overflow: hidden;
}
</style>
