<template>
  <article>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title is-flex is-align-items-center">Triggers</h1>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title">Quick create</h2>
        <create-trigger-form/>
      </div>
    </section>
  </article>
</template>

<script>
import CreateTriggerForm from "@/components/CreateTriggerForm";

export default {
  name: "TriggersView",
  components: {CreateTriggerForm}
}
</script>

<style scoped>

</style>