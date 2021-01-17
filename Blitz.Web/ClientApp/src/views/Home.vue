<template>
  <div class="home">
    <article class="section container">
      <ul class="columns is-6 is-desktop">
        <li class="column">
          <router-link to="/projects">
            <article class="home-card card is-flex is-justify-content-center is-align-items-center">
              <h1 class="title is-5 has-text-centered">Projects</h1>
            </article>
          </router-link>
        </li>
        <li class="column">
          <router-link to="/cronjobs">
            <article class="home-card card is-flex is-justify-content-center is-align-items-center">
              <h1 class="title is-5 has-text-centered">Cronjobs</h1>
            </article>
          </router-link>
        </li>
        <li class="column">
          <router-link to="/executions">
            <article class="home-card card is-flex is-justify-content-center is-align-items-center">
              <h1 class="title is-5 has-text-centered">Executions</h1>
            </article>
          </router-link>
        </li>
      </ul>
    </article>
  </div>
</template>

<script>
import client from "@/api/client";

export default {
  name: 'Home',
  components: {},
}
</script>

<style scoped>
.home-card {
  min-height: 15rem;
  aspect-ratio: 5/4;
}
</style>
