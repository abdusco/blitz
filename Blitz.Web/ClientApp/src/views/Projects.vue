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
        {{projects}}
        <b-table :data="projects">
          <b-table-column field="title" label="Title"/>
          <b-table-column field="cronjobsCount" label="Total Cronjobs"/>
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
    this.projects = await client.listProjects();
  },
  methods: {
    onNewProject: async function () {
      let project = {...this.form};
      const id = await client.createProject(project);
      await this.$router.push(`/projects/${id}`);
    }
  }
}
</script>

<style scoped>

</style>