<template>
  <article>
    <section class="hero hero--gradient">
      <div class="hero-body">
        <div class="container">
          <h1 class="page-title title is-flex is-align-items-center">Cronjobs</h1>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">Quick create</h2>
        <create-cronjob-form @create="onCronjobCreate"/>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">All Cronjobs</h2>
        <b-table :data="cronjobs" custom-row-key="id">
          <b-table-column field="title" label="Title" v-slot="{row}" sortable>
            <router-link :to="{name: 'cronjob', params: {id: row.id}}"><b>{{ row.title }}</b></router-link>
          </b-table-column>
          <b-table-column field="projectTitle" label="Project" v-slot="{row}" sortable>
            <router-link :to="{name: 'project', params: {id: row.projectId}}">{{ row.projectTitle }}</router-link>
          </b-table-column>
          <b-table-column field="cron" label="Schedule" v-slot="{row}">
            <cron-expression v-if="row.cron" :value="row.cron">
              <code>{{ row.cron }}</code>
            </cron-expression>
          </b-table-column>
          <b-table-column field="url" label="Action" v-slot="{row}" sortable>
            <code><b>{{ row.httpMethod }}</b> {{ row.url }}</code>
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
  </article>
</template>

<script>
import CreateCronjobForm from "@/components/CreateCronjobForm";
import client from "@/api/client";
import CronExpression from "@/components/CronExpression";
import ExecutionStatePill from "@/components/ExecutionStatePill";

export default {
  name: "Cronjobs",
  components: {ExecutionStatePill, CronExpression, CreateCronjobForm},
  data() {
    return {
      cronjobs: []
    }
  },
  async mounted() {
    await this.$spin(this.refreshCronjobs());
  },
  methods: {
    async onCronjobCreate(cronjob) {
      const created = await this.$spin(client.createCronjob(cronjob));
      await this.refreshCronjobs();
    },
    async refreshCronjobs() {
      this.cronjobs = await client.listCronjobs();
    },
    async onCronjobToggle(id, value) {
      await client.toggleCronjob(id, value);
    }
  }
}
</script>

<style scoped>

</style>