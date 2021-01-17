<template>
  <nav class="breadcrumb" aria-label="breadcrumbs" v-if="Object.keys(items).length">
    <ul>
      <li v-for="(val, key) of items">
        <router-link :to="val">{{ key }}</router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: "Breadcrumbs",
  props: {
    items: Object
  }
}
</script>