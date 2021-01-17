<template>
  <div>
    <section class="hero hero--gradient">
      <div class="hero-body">
        <div class="container">
          <div class="is-flex is-align-items-center">
            <h1 class="page-title title">Executions</h1>
            <span class="spacer"></span>
            <b class="is-4 mr-2">Autorefresh</b>
            <b-switch v-model="autoRefresh"></b-switch>
          </div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <b-table :data="executions" custom-row-key="id" :loading="loading">
          <b-table-column field="id" label="Id" v-slot="{row}">
            <router-link :to="{name: 'execution', params: {id: row.id}}"><code><b>{{ row.id }}</b></code></router-link>
          </b-table-column>
          <b-table-column field="cronjob.projectTitle" label="Project" v-slot="{row}">
            <router-link :to="{name: 'project', params: {id: row.cronjob.projectId}}">{{ row.cronjob.projectTitle }}
            </router-link>
          </b-table-column>
          <b-table-column field="cronjob.title" label="Cronjob" v-slot="{row}">
            <router-link :to="{name: 'cronjob', params: {id: row.cronjob.id}}">{{ row.cronjob.title }}</router-link>
          </b-table-column>
          <b-table-column field="createdAt" label="Created At" v-slot="{row}">
            <b-tooltip :label="humanizedDate(row.createdAt)"><span class="text--tabular">{{
                formatDate(row.createdAt)
              }}</span></b-tooltip>
          </b-table-column>
          <b-table-column field="state" label="State" v-slot="{row}" sortable>
            <execution-state-pill :value="row.state"/>
          </b-table-column>
          <template v-slot:empty>
            No executions yet.
          </template>
        </b-table>
      </div>
    </section>
  </div>
</template>

<script>
import client from "@/api/client";
import ExecutionStatePill from "@/components/ExecutionStatePill";

export default {
  name: "Projects",
  components: {ExecutionStatePill},
  data() {
    return {
      _interval: null,
      loading: false,
      autoRefresh: true,
      executions: [],
    }
  },
  async mounted() {
    await this.$spin(this.refreshExecutions());
    this.initAutorefresh();
  },
  methods: {
    async refreshExecutions() {
      this.loading = true && !!this.executions.length;
      this.executions = await client.listExecutions();
      this.loading = false;
    },
    initAutorefresh() {
      this._interval = setInterval(
          () => !document.hidden && this.refreshExecutions(),
          5000
      );
    },
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
