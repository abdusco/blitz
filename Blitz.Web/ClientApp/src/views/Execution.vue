<template>
  <article>
    <section class="hero hero--gradient">
      <div class="hero-body">
        <div class="container">
          <breadcrumbs :items="breadcrumbItems"/>
          <h1 class="page-title title mt-4">
            <span class="has-text-weight-medium">Execution</span> <code>{{ execution.id }}</code>
          </h1>
          <table class="mini-status table is-narrow">
            <tr>
              <th>Created at</th>
              <td>
                <b-tooltip :label="humanizedDate(execution.createdAt)"><code>{{
                    formatDate(execution.createdAt)
                  }}</code></b-tooltip>
              </td>
            </tr>
            <tr v-if="execution.state">
              <th>Status</th>
              <td>
                <execution-state-pill :value="execution.state"/>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="is-flex is-align-items-center">
          <h2 class="title is-4 m-0 mr-4">Updates</h2>
          <span class="spacer"></span>
          <b class="is-4">Autorefresh</b>
          <b-switch v-model="autoRefresh" left-label="refresh"></b-switch>
        </div>

        <b-table :data="updates" detailed :show-detail-icon="false" detail-key="id" ref="updates" :loading="loading">
          <template #empty>
            No updates yet.
          </template>
          <template #detail="{row}">
            <table v-if="row.details" class="table is-striped is-fullwidth is-hoverable">
              <thead>
              <tr>
                <th class="is-column-min">Key</th>
                <th>Value</th>
              </tr>
              </thead>
              <tr v-for="(v,k) in flattenObject(row.details)" :key="k">
                <td><code class="text--small text--nowrap has-text-weight-medium">{{ k }}</code></td>
                <td>
                  <pre class="detail-item"><code class="text--small">{{ v }}</code></pre>
                </td>
              </tr>
            </table>
            <span v-else>No details</span>
          </template>

          <b-table-column field="state" label="State" v-slot="{row}" sortable>
            <execution-state-pill :value="row.state"/>
          </b-table-column>
          <b-table-column field="createdAt" label="Date" v-slot="{row}" sortable>
            <b-tooltip :label="humanizedDate(row.createdAt)"><code>{{ formatDate(row.createdAt, true) }}</code>
            </b-tooltip>
          </b-table-column>
          <b-table-column label="Actions" v-slot="{row}" sortable>
            <b-button v-if="Object.keys(row.details).length" rounded type="is-small is-info" @click="toggleRow(row)">
              Details
            </b-button>
          </b-table-column>
        </b-table>
      </div>
    </section>
  </article>
</template>

<script>
import Breadcrumbs from "@/components/Breadcrumbs";
import client from "@/api/client";
import ExecutionStatePill from "@/components/ExecutionStatePill";
import flattenObject from "@/utils/flattenObject";

export default {
  name: "Execution",
  components: {ExecutionStatePill, Breadcrumbs},
  data() {
    return {
      _interval: null,
      loading: false,
      id: this.$route.params.id,
      execution: {},
      cronjob: {},
      updates: [],
      autoRefresh: true,
    }
  },
  async mounted() {
    await this.$spin(this.refreshUpdates());
    this.initAutorefresh();
  },
  methods: {
    flattenObject,
    initAutorefresh() {
      requestAnimationFrame(
          () => this._interval = setInterval(() => this.refreshUpdates(), 5000)
      )
    },
    async refreshUpdates() {
      this.loading = true && this.execution.id;
      const result = await client.getExecutionDetails(this.id);
      this.execution = result;
      this.cronjob = result.cronjob;
      this.updates = result.updates;
      
      if (this.updates.length) {
        this.execution.state = this.updates[0].state;
      }
      
      this.loading = false;
    },
    toggleRow(row) {
      this.$refs.updates.toggleDetails(row);
    }
  },
  computed: {
    breadcrumbItems() {
      return {
        [this.cronjob.projectTitle || '...']: `/projects/${this.cronjob.projectId}`,
        [this.cronjob.title || '...']: `/cronjobs/${this.cronjob.id}`,
      };
    }
  },
  watch: {
    autoRefresh(enabled) {
      if (!enabled) {
        clearInterval(this._interval);
      } else {
        this.initAutorefresh();
      }
    }
  }
}
</script>
<style scoped>
.detail-item {
  font-size: inherit;
  padding: 0;
  white-space: pre-wrap;
  background-color: transparent;
}

.b-table .table tr.detail .detail-container {
  padding: 0;
}
</style>