<template>
  <div class="projects">
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Projects
          </h1>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">Create a new project</h2>
        <form @submit.prevent="onNewProject">
          <b-field label="Title">
            <b-input placeholder="FYM.DEV" v-model="form.title" required></b-input>
          </b-field>
          <b-button type="is-primary" rounded native-type="submit">Save</b-button>
        </form>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">All Projects</h2>
        <b-table :loading="loading" :data="projects">
          <b-table-column field="title" label="Title" v-slot="{row: {title, id}}" sortable>
            <router-link :to="{name: 'project', params: {id}}">{{ title }}</router-link>
          </b-table-column>
          <b-table-column field="cronjobsCount" label="Total Cronjobs" numeric v-slot="{row}" sortable>
            {{ `${row.cronjobsCount}` }}
          </b-table-column>
          <template v-slot:empty>
            No projects yet.
          </template>
        </b-table>
      </div>
    </section>
  </div>
</template>

<script>
import client from "@/api/client";

export default {
  name: "Projects",
  data() {
    return {
      loading: true,
      projects: [],
      form: {
        name: ''
      }
    }
  },
  async mounted() {
    this.projects = await client.listProjects();
    this.loading = false;
  },
  methods: {
    onNewProject: async function () {
      let project = {...this.form};
      const id = await client.createProject(project);
      await this.$router.push({name: 'project', params: {id}});
    }
  }
}
</script>

<style scoped>

</style>