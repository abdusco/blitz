<template>
  <div>
    <section class="hero hero--gradient">
      <div class="hero-body">
        <div class="container">
          <h1 class="page-title title">Projects</h1>
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
        <b-table :data="projects" custom-row-key="id">
          <b-table-column field="title" label="Title" v-slot="{row: {title, id}}" sortable>
            <router-link :to="{name: 'project', params: {id}}"><b>{{ title }}</b></router-link>
          </b-table-column>
          <b-table-column field="cronjobsCount" label="Total Cronjobs" v-slot="{row}" sortable>
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
      projects: [],
      form: {
        name: ''
      }
    }
  },
  async mounted() {
    this.projects = await this.$spin(client.listProjects());
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
