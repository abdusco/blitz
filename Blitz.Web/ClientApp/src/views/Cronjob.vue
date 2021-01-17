<template>
  <article>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <breadcrumbs :items="breadcrumbItems"/>
          <div class="is-flex is-align-items-center mb-5">
            <h1 class="title m-0">{{ cronjob.title || '...' }}</h1>
            <b-button rounded :type="cronjob.enabled ? 'is-info': 'is-light'" size="" class="ml-4 text--smallcaps"
                      :disabled="!cronjob.enabled"
                      :loading="triggering"
                      @click="triggerCronjob">
              Trigger 🗲
            </b-button>
          </div>
          <p class="subtitle mt-4 mb-2">

          </p>
          <table class="mini-status table is-narrow">
            <tr>
              <th>Enabled</th>
              <td>
                <b-switch v-model="cronjob.enabled" @input="(val) => onCronjobToggle(cronjob.id, val)"/>
              </td>
            </tr>

            <tr>
              <th>Action</th>
              <td><code><b>{{ cronjob.httpMethod }}</b> {{ cronjob.url }}</code></td>
            </tr>
            <tr>
              <th>Schedule</th>
              <td>
                <cron-expression v-if="cronjob.cron" :value="cronjob.cron">
                  <code>{{ cronjob.cron }}</code>
                </cron-expression>
              </td>
            </tr>
            <tr v-if="cronjob.lastExecution">
              <th>Last Execution</th>
              <td>
                <execution-state-pill :value="cronjob.lastExecution.state"/>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </section>
    <section class="container py-6">
      <h2 class="title is-size-4">Latest executions</h2>

      <b-table :data="executions">
        <b-table-column field="id" label="Id" v-slot="{row}">
          <router-link :to="{name: 'execution', params: {id: row.id}}"><code>{{ row.id }}</code></router-link>
        </b-table-column>
        <b-table-column field="createdAt" label="Created At" v-slot="{row}" sortable>
          <b-tooltip :label="humanizedDate(row.createdAt)"><span class="text--tabular">{{ formatDate(row.createdAt) }}</span></b-tooltip>
        </b-table-column>
        <b-table-column field="state" label="State" v-slot="{row}" sortable>
          <execution-state-pill :value="row.state"/>
        </b-table-column>
      </b-table>
    </section>
  </article>
</template>

<script>
import Breadcrumbs from "@/components/Breadcrumbs";
import client from "@/api/client";
import ExecutionStatePill from "@/components/ExecutionStatePill";
import CronExpression from "@/components/CronExpression";

export default {
  name: "Cronjob",
  components: {CronExpression, ExecutionStatePill, Breadcrumbs},
  data() {
    return {
      id: this.$route.params.id,
      cronjob: {},
      executions: [],
      triggering: false,
    }
  },
  async mounted() {
    await this.$spin(Promise.all([
      client.getCronjobDetails(this.id).then(val => this.cronjob = val),
      this.refreshExecutions(),
    ]));
  },
  methods: {
    async refreshExecutions() {
      this.executions = await client.getCronjobExecutions(this.id);
    },
    async onCronjobToggle(id, value) {
      await client.toggleCronjob(id, value);
    },
    async triggerCronjob() {
      this.triggering = true;
      try {
        const executionId = await client.triggerCronjob(this.cronjob.id);
        await this.$router.push({name: 'execution', params: {id: executionId}});
      } finally {
        this.triggering = false;
      }
    }
  },
  computed: {
    breadcrumbItems() {
      return {
        'Projects': '/projects',
        [this.cronjob.projectTitle || '...']: `/projects/${this.cronjob.projectId}`
      };
    },
  }
}
</script>

<style scoped>

</style>