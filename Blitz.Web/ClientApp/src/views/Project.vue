<template>
  <div>
    <section class="hero hero--gradient">
      <div class="hero-body">
        <div class="container">
          <breadcrumbs :items="{'Projects': '/projects'}"/>
          <div class="is-flex is-align-items-center mb-5">

            <h1 class="page-title title is-flex is-align-items-center">{{ project.title || '...' }}</h1>
            <span class="spacer"></span>
            <b-button rounded type="is-danger is-light" @click="deleteProject">Delete</b-button>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">Create a new cronjob</h2>
        <create-cronjob-form :project="project" @create="onCreateCronjob"/>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">Cronjobs</h2>
        <b-table :data="project.cronjobs">
          <b-table-column label="Title" field="title" v-slot="{row}" sortable>
            <router-link :to="{name: 'cronjob', params: {id: row.id}}"><b>{{ row.title }}</b></router-link>
          </b-table-column>
          <b-table-column label="Schedule" field="cron" v-slot="{row}">
            <cron-expression v-if="row.cron" :value="row.cron">
              <code>{{ row.cron }}</code>
            </cron-expression>
          </b-table-column>
          <b-table-column label="Enabled" field="enabled" v-slot="{row}" sortable>
            <b-switch v-model="row.enabled" @input="(enabled) => onCronjobToggle(row.id, enabled)"/>
          </b-table-column>
          <template v-slot:empty>
            Nothing here yet.
          </template>
        </b-table>
      </div>
    </section>
  </div>
</template>

<script>
import client from "@/api/client";
import CreateCronjobForm from "@/components/CreateCronjobForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import CronExpression from "@/components/CronExpression";

export default {
  name: "Project",
  components: {CronExpression, Breadcrumbs, CreateCronjobForm},
  data() {
    return {
      id: null,
      project: {},
    }
  },
  async mounted() {
    this.id = this.$route.params.id;
    this.project = await this.$spin(client.getProjectDetails(this.$route.params.id));
  },
  methods: {
    async onCreateCronjob(c) {
      console.log(c);
      const cronjob = await this.$spin(client.createCronjob(c));
      this.project = {
        ...this.project,
        cronjobs: [cronjob, ...this.project.cronjobs || []]
      }
    },
    async onCronjobToggle(id, value) {
      await client.toggleCronjob(id, value);
    },
    async deleteProject() {
      await client.deleteProject(this.project.id);
      await this.$router.push({name: 'projects'});
    }
  }
}
</script>

<style scoped>

</style>