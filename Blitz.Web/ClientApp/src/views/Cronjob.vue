<template>
  <article>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <breadcrumbs :items="breadcrumbItems"/>
          <div class="is-flex is-align-items-center mb-5">
            <h1 class="title m-0">{{ cronjob.title || '...' }}</h1>
            <b-button rounded :type="cronjob.enabled ? 'is-info': 'is-light'" size="" class="ml-4 text--smallcaps" :disabled="!cronjob.enabled"
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
              <td><code>{{ cronjob.httpMethod }} {{ cronjob.url }}</code></td>
            </tr>
            <tr>
              <th>Schedule</th>
              <td><code>{{ cronjob.cron }}</code></td>
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
          <router-link :to="{name: 'execution', params: {id: row.id}}">{{ row.id }}</router-link>
        </b-table-column>
        <b-table-column field="createdAt" label="Created At" v-slot="{row}">{{ row.createdAt }}</b-table-column>
        <b-table-column field="state" label="State" v-slot="{row}">
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

export default {
  name: "Cronjob",
  components: {ExecutionStatePill, Breadcrumbs},
  data() {
    return {
      cronjob: {},
      executions: [],
      triggering: false,
    }
  },
  async mounted() {
    const cronjobId = this.$route.params.id;
    await this.$spin(Promise.all([
      client.getCronjobDetails(cronjobId).then(val => this.cronjob = val),
      client.getCronjobExecutions(cronjobId).then(val => this.executions = val),
    ]));
  },
  methods: {
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
    }
  }
}
</script>

<style scoped>

</style>