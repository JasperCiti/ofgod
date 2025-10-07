<template>
  <div class="tree-node-wrapper">
    <div
      class="tree-node"
      :class="{
        'is-active': isActive,
        'is-parent': hasChildren,
        'is-expanded': isExpanded
      }"
      :style="{ paddingLeft: `${depth * 20}px` }"
    >
      <!-- Expand/collapse chevron for parent nodes -->
      <v-btn
        v-if="hasChildren"
        icon
        size="x-small"
        variant="text"
        class="chevron-button"
        @click="handleToggle"
      >
        <v-icon
          :icon="isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          size="16"
        />
      </v-btn>

      <!-- Active indicator dot -->
      <span v-else class="leaf-indicator" />

      <!-- Node title -->
      <span
        class="node-title"
        :class="{ 'is-parent-title': hasChildren }"
        @click="handleSelect"
      >
        {{ node.title }}
      </span>
    </div>

    <!-- Recursively render children -->
    <div v-if="isExpanded && hasChildren" class="tree-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-path="activePath"
        :expanded-ids="expandedIds"
        :depth="depth + 1"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TreeNode as TreeNodeType } from '~/composables/useNavigationTree'

const props = defineProps<{
  node: TreeNodeType
  activePath: string
  expandedIds: Set<string>
  depth: number
}>()

const emit = defineEmits<{
  toggle: [id: string]
  select: [path: string]
}>()

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
const isExpanded = computed(() => props.expandedIds.has(props.node.id))
const isActive = computed(() => props.node.path === props.activePath)

function handleToggle() {
  emit('toggle', props.node.id)
}

function handleSelect() {
  emit('select', props.node.path)
}
</script>

<style scoped>
.tree-node-wrapper {
  width: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-radius: 4px;
  margin: 2px 0;
}

.tree-node:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.tree-node.is-active {
  background-color: rgb(var(--v-theme-selectable));
  color: rgb(var(--v-theme-on-selected));
}

.chevron-button {
  margin-right: 4px;
  flex-shrink: 0;
}

.leaf-indicator {
  width: 24px;
  height: 24px;
  margin-right: 4px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.leaf-indicator::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.tree-node.is-active .leaf-indicator::before {
  background-color: rgb(var(--v-theme-on-selected));
}

.node-title {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface-rail));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;
}

.node-title.is-parent-title {
  font-weight: 500;
}

.tree-node.is-active .node-title {
  font-weight: 600;
  color: rgb(var(--v-theme-on-selected));
}

.tree-children {
  width: 100%;
}

/* Touch target size for mobile */
@media (max-width: 599px) {
  .tree-node {
    min-height: 48px;
  }
}
</style>
