<template>
  <main id="app" ref="app">
    <div>
      <div v-if="$route.path !== '/'"
           class="is-flex is-align-items-center is-justify-content-space-around container">
        <h1 class="title m-0 is-4">
          <router-link to="/" class="has-text-warning">🗲 blitz</router-link>
        </h1>
        <span class="spacer"></span>
        <nav class="navbar">
          <nav-link to="/projects">projects</nav-link>
          <nav-link to="/cronjobs">cronjobs</nav-link>
          <nav-link to="/executions">executions</nav-link>
        </nav>
        <span class="spacer"></span>
      </div>
      <router-view/>
    </div>
  </main>
</template>

<style>

</style>
<script>
import NavLink from "@/components/NavLink";

export default {
  components: {NavLink},
  data() {
    return {}
  }
}
</script>

<style>
</style>