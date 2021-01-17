<template>
  <div>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            Executions
          </h1>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <b-table :data="executions" custom-row-key="id">
          <b-table-column field="id" label="Id" v-slot="{row}">
            <router-link :to="{name: 'execution', params: {id: row.id}}"><code><b>{{ row.id }}</b></code></router-link>
          </b-table-column>
          <b-table-column field="cronjob.projectTitle" label="Project" v-slot="{row}">
            <router-link :to="{name: 'project', params: {id: row.cronjob.projectId}}">{{row.cronjob.projectTitle}}</router-link>
          </b-table-column>
          <b-table-column field="cronjob.title" label="Cronjob" v-slot="{row}">
            <router-link :to="{name: 'cronjob', params: {id: row.cronjob.id}}">{{row.cronjob.title}}</router-link>
          </b-table-column>
          <b-table-column field="createdAt" label="Created At" v-slot="{row}">
            <b-tooltip :label="humanizedDate(row.createdAt)"><span class="text--tabular">{{ formatDate(row.createdAt) }}</span></b-tooltip>
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
      executions: [],
    }
  },
  async mounted() {
    this.executions = await this.$spin(client.listExecutions());
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
