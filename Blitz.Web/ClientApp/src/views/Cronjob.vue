<template>
  <article>
    <section class="hero hero--gradient">
      <div class="hero-body">
        <div class="container">
          <breadcrumbs :items="breadcrumbItems"/>
          <div class="is-flex is-align-items-center mb-5">
            <h1 class="page-title is-unselectable title m-0" @dblclick="onEditTitle">
              <b-tooltip label="Double click to edit title" type="is-info" position="is-bottom" :delay="500">
                <span class="editable">
                {{ cronjob.title || '...' }}
              </span>
              </b-tooltip>
            </h1>
            <b-button rounded type="is-primary" 
                      class="ml-5 text--smallcaps"
                      :loading="triggering"
                      @click="triggerCronjob">
              Trigger 🗲
            </b-button>
            <span class="spacer"></span>
            <b-button rounded type="is-danger is-light" class="ml-2" @click="deleteCronjob">Delete</b-button>
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
            <tr v-if="lastExecution">
              <th>Last Execution</th>
              <td>
                <execution-state-pill :value="lastExecution.state"/>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </section>
    <section class="container py-6">
      <div class="is-flex is-align-items-center mb-4">
        <h2 class="title is-size-4 m-0 mr-4">Latest executions</h2>
        <span class="spacer"></span>
        <b-button rounded type="is-light" @click="clearExecutions">Clear</b-button>
      </div>

      <b-table :data="executions">
        <b-table-column field="id" label="Id" v-slot="{row}">
          <router-link :to="{name: 'execution', params: {id: row.id}}"><code><b>{{ row.id.toUpperCase() }}</b></code></router-link>
        </b-table-column>
        <b-table-column field="createdAt" label="Created At" v-slot="{row}" sortable>
          <b-tooltip :label="humanizedDate(row.createdAt)"><span class="text--tabular">{{
              formatDate(row.createdAt, {seconds: true})
            }}</span></b-tooltip>
        </b-table-column>
        <b-table-column field="state" label="State" v-slot="{row}" sortable>
          <execution-state-pill :value="row.state"/>
        </b-table-column>
        <template #empty>No executions yet.</template>
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
      this.refreshDetails(),
      this.refreshExecutions(),
    ]));
  },
  methods: {
    async refreshExecutions() {
      this.executions = await client.getCronjobExecutions(this.id)
      this.cronjob.lastExecution = (this.executions[0] || {});
    },
    async refreshDetails() {
      this.cronjob = await client.getCronjobDetails(this.id);
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
    },
    async deleteCronjob() {
      await client.deleteCronjob(this.cronjob.id);
      await this.$router.push({name: 'project', params: {id: this.cronjob.projectId}});
    },
    async clearExecutions() {
      await client.clearCronjobExecutions(this.cronjob.id);
      await this.$spin(this.refreshExecutions());
    },
    async onEditTitle() {
      this.$buefy.dialog.prompt({
        message: `Edit title for "${this.cronjob.title}"`,
        inputAttrs: {
          type: 'text',
          placeholder: 'new title',
          value: this.cronjob.title,
          required: true
        },
        confirmText: 'Update',
        trapFocus: true,
        closeOnConfirm: false,
        onConfirm: async (value, {close}) => {
          await client.updateCronjob(this.cronjob.id, {title: value});
          await this.refreshDetails();
          close();
        }
      })
    }
  },
  computed: {
    breadcrumbItems() {
      return {
        'Projects': '/projects',
        [this.cronjob.projectTitle || '...']: `/projects/${this.cronjob.projectId}`
      };
    },
    lastExecution() {
      return this.executions[0] || {};
    }
  }
}
</script>

<style scoped>
.editable:hover {
  transition: 0.2s 0.25s;
  display: inline;
  background-color: gray;
  color: white;
  padding: 0.25rem 0;
  cursor: text;
}
</style>