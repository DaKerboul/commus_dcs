<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
    <!-- Page header -->
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Soumettre une communauté</h1>
      <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        Remplissez les informations de votre communauté DCS francophone. Plus vous renseignez de détails, plus votre fiche sera complète.
      </p>
    </div>

    <!-- Draft banner -->
    <div v-if="hasDraft && !draftRestored && !submitted" class="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-document-text" class="text-amber-400 text-xl shrink-0" />
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Brouillon trouvé</p>
          <p class="text-xs text-gray-500">Vous avez un brouillon sauvegardé automatiquement. Voulez-vous le reprendre ?</p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <UButton size="sm" color="warning" variant="soft" @click="restoreDraft">Reprendre</UButton>
        <UButton size="sm" variant="ghost" color="neutral" @click="discardDraft">Supprimer</UButton>
      </div>
    </div>

    <!-- Success state with confetti -->
    <div v-if="submitted" class="max-w-lg mx-auto rounded-2xl border border-green-500/30 bg-green-500/5 p-10 text-center">
      <UIcon name="i-heroicons-check-circle" class="text-green-400 text-5xl" />
      <h2 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Soumission envoyée !</h2>
      <p class="mt-3 text-gray-500 dark:text-gray-400">Nous examinerons votre demande dans les meilleurs délais. Vous serez contacté si besoin.</p>
      <div class="mt-6 flex justify-center gap-3">
        <UButton to="/" variant="outline" color="neutral">Retour à l'accueil</UButton>
        <UButton to="/communautes" color="primary">Voir les communautés</UButton>
      </div>
    </div>

    <form v-else @submit.prevent="submit">
      <!-- Progress bar with completion % -->
      <div class="mb-10">
        <div class="flex justify-between mb-2">
          <button
            v-for="(s, i) in steps"
            :key="i"
            type="button"
            class="flex flex-col items-center gap-1 group relative"
            @click="goToStep(i)"
          >
            <!-- Error dot -->
            <span v-if="stepHasErrors(i) && step !== i" class="absolute -top-1 -right-1 flex h-3 w-3 z-10">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span class="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <div
              class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all text-sm font-semibold"
              :class="step === i
                ? 'border-blue-500 bg-blue-500 text-white scale-110'
                : step > i
                  ? stepHasErrors(i) ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-green-500 bg-green-500/10 text-green-500'
                  : 'border-gray-300 dark:border-gray-700 text-gray-400 group-hover:border-gray-400'"
            >
              <UIcon v-if="step > i && !stepHasErrors(i)" name="i-heroicons-check" class="text-base" />
              <UIcon v-else-if="step > i && stepHasErrors(i)" name="i-heroicons-exclamation-triangle" class="text-base" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-xs font-medium hidden sm:block transition-colors"
              :class="step === i ? 'text-blue-500' : step > i ? (stepHasErrors(i) ? 'text-red-500' : 'text-green-500') : 'text-gray-400'"
            >
              {{ s.label }}
            </span>
          </button>
        </div>
        <!-- Progress track with completion % -->
        <div class="relative h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full">
          <div
            class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            :class="completionPercent === 100 ? 'bg-green-500' : 'bg-blue-500'"
            :style="{ width: `${completionPercent}%` }"
          />
        </div>
        <div class="mt-1.5 text-right">
          <span class="text-xs font-medium" :class="completionPercent === 100 ? 'text-green-500' : 'text-gray-400'">
            {{ completionPercent }}% complété
          </span>
        </div>
      </div>

      <!-- Step container with transitions -->
      <div class="relative overflow-hidden">
        <Transition :name="slideDirection" mode="out-in">
          <!-- Step 1: Infos de base -->
          <div v-if="step === 0" key="step-0">
            <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
                  <UIcon name="i-heroicons-information-circle" class="text-blue-500 text-xl" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations de base</h2>
                  <p class="text-sm text-gray-500">Les informations essentielles de votre communauté.</p>
                </div>
              </div>

              <div class="space-y-6">
                <!-- Row: name + contact (required) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <UFormField label="Nom de la communauté *" required :error="touched.communityName && !form.communityName ? 'Champ obligatoire' : undefined">
                    <UInput
                      v-model="form.communityName"
                      name="communityName"
                      placeholder="Ex: VEAF, 3rd Wing, Split'Air..."
                      size="lg"
                      class="w-full"
                      :class="{ 'shake-field': shakeField === 'communityName' }"
                      @blur="touched.communityName = true"
                    />
                  </UFormField>
                  <UFormField label="Nom / pseudo du contact *" required :error="touched.contactName && !form.contactName ? 'Champ obligatoire' : undefined">
                    <UInput
                      v-model="form.contactName"
                      name="contactName"
                      placeholder="Votre pseudo Discord"
                      size="lg"
                      class="w-full"
                      :class="{ 'shake-field': shakeField === 'contactName' }"
                      @blur="touched.contactName = true"
                    />
                  </UFormField>
                </div>

                <UFormField label="Description courte">
                  <UInput v-model="form.shortDescription" name="shortDescription" placeholder="Une phrase pour décrire votre communauté" size="lg" maxlength="200" class="w-full" />
                  <template #hint>
                    <span :class="form.shortDescription.length > 180 ? 'text-orange-400' : 'text-gray-400'">
                      {{ form.shortDescription.length }}/200
                    </span>
                  </template>
                </UFormField>

                <UFormField label="Description complète">
                  <UTextarea v-model="form.description" name="description" placeholder="Historique, valeurs, activités principales de votre communauté..." :rows="5" size="lg" class="w-full" />
                  <template #hint>
                    <span class="text-gray-400">{{ form.description.length }} caractères</span>
                  </template>
                </UFormField>

                <UFormField label="Objectifs">
                  <UTextarea v-model="form.objectives" name="objectives" placeholder="Objectifs et missions — qu'est-ce qui rend votre communauté unique ?" :rows="3" size="lg" class="w-full" />
                </UFormField>

                <!-- Row: founder + size + entry conditions -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <UFormField label="Fondateur">
                    <UInput v-model="form.founder" name="founder" placeholder="Pseudo du fondateur" class="w-full" />
                  </UFormField>
                  <UFormField label="Taille (texte libre)">
                    <UInput v-model="form.sizeText" name="sizeText" placeholder="Ex: ~50 membres actifs" class="w-full" />
                  </UFormField>
                  <UFormField label="Conditions d'entrée">
                    <UInput v-model="form.entryConditions" name="entryConditions" placeholder="Âge min, entretien..." class="w-full" />
                  </UFormField>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Classification -->
          <div v-else-if="step === 1" key="step-1">
            <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10">
                  <UIcon name="i-heroicons-tag" class="text-purple-500 text-xl" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Classification</h2>
                  <p class="text-sm text-gray-500">Catégorisez votre communauté pour faciliter sa découverte.</p>
                </div>
              </div>

              <div class="space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <UFormField label="Type de communauté">
                    <USelect v-model="form.communityType" :items="typeOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
                  </UFormField>
                  <UFormField label="Taille">
                    <USelect v-model="form.sizeCategory" :items="sizeOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
                  </UFormField>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <UFormField label="Statut de recrutement">
                    <USelect v-model="form.recruitmentStatus" :items="recruitmentOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
                  </UFormField>
                  <UFormField label="Fréquence d'événements">
                    <USelect v-model="form.eventFrequency" :items="frequencyOptions" placeholder="Sélectionner..." size="lg" class="w-full" />
                  </UFormField>
                </div>

                <UFormField label="Périodes historiques jouées">
                  <template #hint>
                    <UTooltip text="Quelles époques vos missions couvrent-elles ? Guerre Froide, moderne, WW2...">
                      <UIcon name="i-heroicons-question-mark-circle" class="text-gray-400 hover:text-gray-300 cursor-help" />
                    </UTooltip>
                  </template>
                  <p class="text-xs text-gray-500 mb-2">Cliquez pour sélectionner (multi-choix)</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="p in periodOptions"
                      :key="p.value"
                      type="button"
                      class="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                      :class="form.historicalPeriods.includes(p.value)
                        ? 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/25'
                        : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-gray-400'"
                      @click="toggleArray(form.historicalPeriods, p.value)"
                    >
                      {{ p.label }}
                    </button>
                  </div>
                </UFormField>
              </div>
            </div>
          </div>

          <!-- Step 3: Modules & Expériences -->
          <div v-else-if="step === 2" key="step-2">
            <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10">
                  <UIcon name="i-heroicons-puzzle-piece" class="text-orange-500 text-xl" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Modules & Expériences</h2>
                  <p class="text-sm text-gray-500">Quels modules utilisez-vous et quelles expériences proposez-vous ?</p>
                </div>
              </div>

              <div class="space-y-8">
                <!-- Modules utilisés -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Modules utilisés
                      <span v-if="form.moduleNames.length" class="ml-1 text-blue-500">({{ form.moduleNames.length }})</span>
                    </label>
                    <div class="flex items-center gap-2">
                      <button type="button" class="text-xs text-blue-400 hover:text-blue-300 transition-colors" @click="selectAllModules('used')">Tout</button>
                      <span class="text-gray-600">·</span>
                      <button type="button" class="text-xs text-gray-400 hover:text-gray-300 transition-colors" @click="form.moduleNames = []">Aucun</button>
                      <UInput
                        v-model="moduleSearch"
                        name="module-search"
                        placeholder="Filtrer..."
                        size="xs"
                        icon="i-heroicons-magnifying-glass"
                        class="w-40"
                      />
                    </div>
                  </div>
                  <div v-if="allModules" class="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                    <button
                      v-for="m in filteredModules"
                      :key="m.id"
                      type="button"
                      class="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
                      :class="form.moduleNames.includes(m.name)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-blue-400'"
                      @click="toggleArray(form.moduleNames, m.name)"
                    >
                      {{ m.name }}
                    </button>
                  </div>
                </div>

                <!-- Modules recherchés -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Modules recherchés
                      <span v-if="form.soughtModuleNames.length" class="ml-1 text-amber-500">({{ form.soughtModuleNames.length }})</span>
                      <UTooltip text="Modules que vos membres veulent acquérir ou pour lesquels vous cherchez des pilotes">
                        <UIcon name="i-heroicons-question-mark-circle" class="text-gray-400 hover:text-gray-300 cursor-help ml-1" />
                      </UTooltip>
                    </label>
                    <div class="flex items-center gap-2">
                      <button type="button" class="text-xs text-amber-400 hover:text-amber-300 transition-colors" @click="selectAllModules('sought')">Tout</button>
                      <span class="text-gray-600">·</span>
                      <button type="button" class="text-xs text-gray-400 hover:text-gray-300 transition-colors" @click="form.soughtModuleNames = []">Aucun</button>
                      <UInput
                        v-model="soughtModuleSearch"
                        name="sought-module-search"
                        placeholder="Filtrer..."
                        size="xs"
                        icon="i-heroicons-magnifying-glass"
                        class="w-40"
                      />
                    </div>
                  </div>
                  <div v-if="allModules" class="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                    <button
                      v-for="m in filteredSoughtModules"
                      :key="m.id"
                      type="button"
                      class="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
                      :class="form.soughtModuleNames.includes(m.name)
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-amber-400'"
                      @click="toggleArray(form.soughtModuleNames, m.name)"
                    >
                      {{ m.name }}
                    </button>
                  </div>
                </div>

                <!-- Expériences groupées par catégorie -->
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Types d'expériences proposées</label>
                    <UTooltip text="Quelles activités et services votre communauté propose-t-elle ?">
                      <UIcon name="i-heroicons-question-mark-circle" class="text-gray-400 hover:text-gray-300 cursor-help" />
                    </UTooltip>
                  </div>
                  <div v-if="allExperiences" class="space-y-5">
                    <div v-for="cat in experienceCategories" :key="cat.key">
                      <div class="flex items-center gap-2 mb-2">
                        <UIcon :name="cat.icon" :class="cat.textColor" class="text-sm" />
                        <span class="text-xs font-semibold uppercase tracking-wider" :class="cat.textColor">{{ cat.label }}</span>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <button
                          v-for="e in cat.items"
                          :key="e.id"
                          type="button"
                          class="px-2.5 py-1 rounded-md text-xs font-medium border transition-all"
                          :class="form.experienceNames.includes(e.name)
                            ? `${cat.bgActive} text-white ${cat.borderActive} shadow-sm`
                            : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-gray-400'"
                          @click="toggleArray(form.experienceNames, e.name)"
                        >
                          {{ e.name }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Liens & Réseaux -->
          <div v-else-if="step === 3" key="step-3">
            <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/10">
                  <UIcon name="i-heroicons-link" class="text-green-500 text-xl" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Liens & Réseaux</h2>
                  <p class="text-sm text-gray-500">Ajoutez les liens de votre communauté. Seul Discord est recommandé, le reste est optionnel.</p>
                </div>
              </div>

              <div class="space-y-6">
                <!-- Discord en prominence with validation -->
                <UFormField label="Discord (recommandé)">
                  <div class="relative">
                    <UInput v-model="form.discordUrl" name="discordUrl" placeholder="https://discord.gg/..." icon="i-simple-icons-discord" size="lg" class="w-full" />
                    <span v-if="form.discordUrl" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <UIcon
                        :name="isDiscordValid ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
                        :class="isDiscordValid ? 'text-green-400' : 'text-orange-400'"
                      />
                    </span>
                  </div>
                  <template v-if="form.discordUrl && !isDiscordValid" #hint>
                    <span class="text-orange-400 text-xs">Format attendu : https://discord.gg/... ou https://discord.com/invite/...</span>
                  </template>
                </UFormField>

                <UFormField label="Site web">
                  <UInput v-model="form.websiteUrl" name="websiteUrl" placeholder="https://..." icon="i-heroicons-globe-alt" size="lg" class="w-full" />
                </UFormField>

                <!-- Social links in 2-column grid -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Réseaux sociaux</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UInput v-model="form.youtubeUrl" name="youtubeUrl" placeholder="YouTube" icon="i-simple-icons-youtube" class="w-full" />
                    <UInput v-model="form.twitchUrl" name="twitchUrl" placeholder="Twitch" icon="i-simple-icons-twitch" class="w-full" />
                    <UInput v-model="form.twitterUrl" name="twitterUrl" placeholder="Twitter / X" icon="i-simple-icons-x" class="w-full" />
                    <UInput v-model="form.instagramUrl" name="instagramUrl" placeholder="Instagram" icon="i-simple-icons-instagram" class="w-full" />
                    <UInput v-model="form.facebookUrl" name="facebookUrl" placeholder="Facebook" icon="i-simple-icons-facebook" class="w-full" />
                  </div>
                </div>

                <!-- Logo upload with crop -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                  <div class="flex items-center gap-4">
                    <!-- Logo preview / placeholder -->
                    <div
                      class="shrink-0 h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-blue-400"
                      :class="form.logoUrl
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                        : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50'"
                      @click="triggerLogoInput"
                    >
                      <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="h-full w-full object-cover rounded-xl" />
                      <UIcon v-else name="i-heroicons-camera" class="text-2xl text-gray-400" />
                    </div>
                    <div class="flex-1 space-y-2">
                      <div class="flex items-center gap-2">
                        <UButton size="sm" variant="soft" color="primary" icon="i-heroicons-arrow-up-tray" @click="triggerLogoInput">
                          {{ form.logoUrl ? 'Changer le logo' : 'Uploader un logo' }}
                        </UButton>
                        <UButton v-if="form.logoUrl" size="sm" variant="ghost" color="error" icon="i-heroicons-trash" @click="form.logoUrl = ''">
                          Supprimer
                        </UButton>
                      </div>
                      <p class="text-xs text-gray-400">PNG, JPG ou WebP — sera recadré en carré et compressé (256×256)</p>
                    </div>
                    <input
                      ref="logoInputRef"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="onLogoFileChange"
                    />
                  </div>
                </div>

                <!-- Screenshots upload -->
                <ScreenshotUploader v-model="screenshots" />
              </div>

              <!-- Logo crop modal -->
              <ClientOnly>
                <LogoCropModal
                  v-model:open="cropModalOpen"
                  :image-src="cropImageSrc"
                  @cropped="onLogoCropped"
                />
              </ClientOnly>
            </div>
          </div>

          <!-- Step 5: Récapitulatif -->
          <div v-else-if="step === 4" key="step-4">
            <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10">
                  <UIcon name="i-heroicons-eye" class="text-cyan-500 text-xl" />
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Récapitulatif</h2>
                  <p class="text-sm text-gray-500">Vérifiez les informations avant d'envoyer. Cliquez sur "Modifier" pour corriger.</p>
                </div>
              </div>

              <div class="space-y-6">
                <!-- Section: Infos de base -->
                <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Informations de base</h3>
                    <UButton variant="ghost" color="neutral" size="xs" icon="i-heroicons-pencil" @click="step = 0">Modifier</UButton>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span class="text-gray-500">Nom :</span>
                      <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ form.communityName || '—' }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Contact :</span>
                      <span class="ml-1 font-medium text-gray-900 dark:text-white">{{ form.contactName || '—' }}</span>
                    </div>
                    <div v-if="form.shortDescription" class="sm:col-span-2">
                      <span class="text-gray-500">Description courte :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ form.shortDescription }}</span>
                    </div>
                    <div v-if="form.founder">
                      <span class="text-gray-500">Fondateur :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ form.founder }}</span>
                    </div>
                    <div v-if="form.sizeText">
                      <span class="text-gray-500">Taille :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ form.sizeText }}</span>
                    </div>
                  </div>
                </div>

                <!-- Section: Classification -->
                <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Classification</h3>
                    <UButton variant="ghost" color="neutral" size="xs" icon="i-heroicons-pencil" @click="step = 1">Modifier</UButton>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div v-if="form.communityType">
                      <span class="text-gray-500">Type :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ TYPE_LABELS[form.communityType] || form.communityType }}</span>
                    </div>
                    <div v-if="form.sizeCategory">
                      <span class="text-gray-500">Taille :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ SIZE_LABELS[form.sizeCategory] || form.sizeCategory }}</span>
                    </div>
                    <div v-if="form.recruitmentStatus">
                      <span class="text-gray-500">Recrutement :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ RECRUITMENT_LABELS[form.recruitmentStatus] || form.recruitmentStatus }}</span>
                    </div>
                    <div v-if="form.eventFrequency">
                      <span class="text-gray-500">Événements :</span>
                      <span class="ml-1 text-gray-900 dark:text-white">{{ FREQUENCY_LABELS[form.eventFrequency] || form.eventFrequency }}</span>
                    </div>
                    <div v-if="form.historicalPeriods.length" class="sm:col-span-2">
                      <span class="text-gray-500">Périodes :</span>
                      <span class="ml-1 flex flex-wrap gap-1 mt-1">
                        <UBadge v-for="p in form.historicalPeriods" :key="p" variant="subtle" color="neutral" size="xs">{{ PERIOD_LABELS[p] || p }}</UBadge>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Section: Modules & Expériences -->
                <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Modules & Expériences</h3>
                    <UButton variant="ghost" color="neutral" size="xs" icon="i-heroicons-pencil" @click="step = 2">Modifier</UButton>
                  </div>
                  <div class="space-y-3 text-sm">
                    <div v-if="form.moduleNames.length">
                      <span class="text-gray-500">Modules utilisés ({{ form.moduleNames.length }}) :</span>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <UBadge v-for="m in form.moduleNames" :key="m" variant="subtle" color="primary" size="xs">{{ m }}</UBadge>
                      </div>
                    </div>
                    <div v-if="form.soughtModuleNames.length">
                      <span class="text-gray-500">Modules recherchés ({{ form.soughtModuleNames.length }}) :</span>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <UBadge v-for="m in form.soughtModuleNames" :key="m" variant="outline" color="warning" size="xs">{{ m }}</UBadge>
                      </div>
                    </div>
                    <div v-if="form.experienceNames.length">
                      <span class="text-gray-500">Expériences ({{ form.experienceNames.length }}) :</span>
                      <div class="flex flex-wrap gap-1 mt-1">
                        <UBadge v-for="e in form.experienceNames" :key="e" variant="subtle" color="success" size="xs">{{ e }}</UBadge>
                      </div>
                    </div>
                    <p v-if="!form.moduleNames.length && !form.soughtModuleNames.length && !form.experienceNames.length" class="text-gray-400 italic">Aucun module ou expérience sélectionné.</p>
                  </div>
                </div>

                <!-- Section: Liens & Réseaux -->
                <div class="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Liens & Réseaux</h3>
                    <UButton variant="ghost" color="neutral" size="xs" icon="i-heroicons-pencil" @click="step = 3">Modifier</UButton>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div v-if="form.discordUrl" class="flex items-center gap-2">
                      <UIcon name="i-simple-icons-discord" class="text-blue-400 text-sm" />
                      <a :href="form.discordUrl" target="_blank" class="text-blue-400 hover:underline truncate">{{ form.discordUrl }}</a>
                    </div>
                    <div v-if="form.websiteUrl" class="flex items-center gap-2">
                      <UIcon name="i-heroicons-globe-alt" class="text-gray-400 text-sm" />
                      <a :href="form.websiteUrl" target="_blank" class="text-blue-400 hover:underline truncate">{{ form.websiteUrl }}</a>
                    </div>
                    <div v-if="form.youtubeUrl" class="flex items-center gap-2">
                      <UIcon name="i-simple-icons-youtube" class="text-red-400 text-sm" />
                      <span class="text-gray-900 dark:text-white truncate">{{ form.youtubeUrl }}</span>
                    </div>
                    <div v-if="form.twitchUrl" class="flex items-center gap-2">
                      <UIcon name="i-simple-icons-twitch" class="text-purple-400 text-sm" />
                      <span class="text-gray-900 dark:text-white truncate">{{ form.twitchUrl }}</span>
                    </div>
                    <div v-if="form.logoUrl" class="flex items-center gap-3 mt-2">
                      <span class="text-gray-500">Logo :</span>
                      <img :src="form.logoUrl" alt="Logo" class="h-10 w-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                    </div>
                    <div v-if="screenshots.length" class="mt-3">
                      <span class="text-gray-500">Screenshots ({{ screenshots.length }}) :</span>
                      <div class="flex flex-wrap gap-2 mt-2">
                        <img v-for="(s, i) in screenshots" :key="i" :src="s" alt="Screenshot" class="h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                      </div>
                    </div>
                    <p v-if="!form.discordUrl && !form.websiteUrl && !form.youtubeUrl && !form.twitchUrl && !form.logoUrl && !screenshots.length" class="text-gray-400 italic">Aucun lien ou média renseigné.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Error -->
      <div v-if="error" class="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
        <UIcon name="i-heroicons-exclamation-triangle" />
        {{ error }}
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between mt-8">
        <UButton
          v-if="step > 0"
          variant="outline"
          color="neutral"
          icon="i-heroicons-arrow-left"
          size="lg"
          @click="prevStep"
        >
          Précédent
        </UButton>
        <div v-else />

        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400 hidden sm:block">Étape {{ step + 1 }}/{{ steps.length }} · <kbd class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px]">Alt</kbd>+<kbd class="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px]">←→</kbd></span>
          <UButton
            v-if="step < steps.length - 1"
            color="primary"
            trailing-icon="i-heroicons-arrow-right"
            size="lg"
            @click="nextStep"
          >
            {{ step === steps.length - 2 ? 'Récapitulatif' : 'Suivant' }}
          </UButton>
          <UButton
            v-else
            type="submit"
            color="primary"
            :loading="loading"
            icon="i-heroicons-paper-airplane"
            size="lg"
          >
            Envoyer la soumission
          </UButton>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { SIZE_LABELS, TYPE_LABELS, RECRUITMENT_LABELS, FREQUENCY_LABELS, PERIOD_LABELS } from '#shared/types'

useHead({ title: 'Soumettre — Commus DCS FR' })

// ── Steps ──────────────────────────────────────────────
const step = ref(0)
const steps = [
  { label: 'Infos', icon: 'i-heroicons-information-circle' },
  { label: 'Classification', icon: 'i-heroicons-tag' },
  { label: 'Modules', icon: 'i-heroicons-puzzle-piece' },
  { label: 'Liens', icon: 'i-heroicons-link' },
  { label: 'Récap', icon: 'i-heroicons-eye' },
]

// Track slide direction for transitions
const slideDirection = ref<'slide-left' | 'slide-right'>('slide-left')
watch(step, (newVal, oldVal) => {
  slideDirection.value = newVal > oldVal ? 'slide-left' : 'slide-right'
})

// ── Options ────────────────────────────────────────────
const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))
const sizeOptions = Object.entries(SIZE_LABELS).map(([value, label]) => ({ value, label }))
const recruitmentOptions = Object.entries(RECRUITMENT_LABELS).map(([value, label]) => ({ value, label }))
const frequencyOptions = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))
const periodOptions = Object.entries(PERIOD_LABELS).map(([value, label]) => ({ value, label }))

// ── Data fetching ──────────────────────────────────────
const { data: allModules } = await useFetch<{ id: number; name: string }[]>('/api/modules')
const { data: allExperiences } = await useFetch<{ id: number; name: string; slug: string; category: string | null }[]>('/api/experiences')

// ── Module search filters ──────────────────────────────
const moduleSearch = ref('')
const soughtModuleSearch = ref('')

const filteredModules = computed(() => {
  if (!allModules.value) return []
  if (!moduleSearch.value) return allModules.value
  const q = moduleSearch.value.toLowerCase()
  return allModules.value.filter(m => m.name.toLowerCase().includes(q))
})

const filteredSoughtModules = computed(() => {
  if (!allModules.value) return []
  if (!soughtModuleSearch.value) return allModules.value
  const q = soughtModuleSearch.value.toLowerCase()
  return allModules.value.filter(m => m.name.toLowerCase().includes(q))
})

function selectAllModules(type: 'used' | 'sought') {
  if (type === 'used') {
    const visibleNames = filteredModules.value.map(m => m.name)
    for (const n of visibleNames) {
      if (!form.moduleNames.includes(n)) form.moduleNames.push(n)
    }
  } else {
    const visibleNames = filteredSoughtModules.value.map(m => m.name)
    for (const n of visibleNames) {
      if (!form.soughtModuleNames.includes(n)) form.soughtModuleNames.push(n)
    }
  }
}

// ── Experience categories ──────────────────────────────
const experienceCategories = computed(() => {
  if (!allExperiences.value) return []
  const catDefs = [
    { key: 'mission_role', label: 'Rôles de mission', icon: 'i-heroicons-fire', textColor: 'text-blue-400', bgActive: 'bg-blue-500', borderActive: 'border-blue-500' },
    { key: 'gameplay', label: 'Types de gameplay', icon: 'i-heroicons-puzzle-piece', textColor: 'text-purple-400', bgActive: 'bg-purple-500', borderActive: 'border-purple-500' },
    { key: 'skill_level', label: 'Niveau & Structure', icon: 'i-heroicons-academic-cap', textColor: 'text-green-400', bgActive: 'bg-green-500', borderActive: 'border-green-500' },
    { key: 'infrastructure', label: 'Infrastructure & Services', icon: 'i-heroicons-server-stack', textColor: 'text-orange-400', bgActive: 'bg-orange-500', borderActive: 'border-orange-500' },
  ]
  const cats = catDefs.map(def => ({
    ...def,
    items: allExperiences.value!.filter(e => e.category === def.key),
  })).filter(c => c.items.length > 0)

  // Uncategorized fallback
  const uncategorized = allExperiences.value!.filter(e => !e.category)
  if (uncategorized.length > 0) {
    cats.push({
      key: 'other',
      label: 'Autres',
      icon: 'i-heroicons-squares-2x2',
      textColor: 'text-gray-400',
      bgActive: 'bg-emerald-500',
      borderActive: 'border-emerald-500',
      items: uncategorized,
    })
  }
  return cats
})

// ── Form ───────────────────────────────────────────────
const form = reactive({
  communityName: '',
  contactName: '',
  shortDescription: '',
  description: '',
  objectives: '',
  founder: '',
  sizeText: '',
  entryConditions: '',
  communityType: '',
  sizeCategory: '',
  recruitmentStatus: '',
  eventFrequency: '',
  historicalPeriods: [] as string[],
  moduleNames: [] as string[],
  soughtModuleNames: [] as string[],
  experienceNames: [] as string[],
  discordUrl: '',
  websiteUrl: '',
  youtubeUrl: '',
  twitchUrl: '',
  twitterUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  logoUrl: '',
})

const loading = ref(false)
const submitted = ref(false)
const error = ref('')
const touched = reactive({ communityName: false, contactName: false })
const shakeField = ref('')
const screenshots = ref<string[]>([])

// ── Logo upload ────────────────────────────────────────
const logoInputRef = ref<HTMLInputElement>()
const cropModalOpen = ref(false)
const cropImageSrc = ref('')

function triggerLogoInput() {
  logoInputRef.value?.click()
}

function onLogoFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    const file = input.files[0]
    if (!file.type.startsWith('image/')) return
    cropImageSrc.value = URL.createObjectURL(file)
    cropModalOpen.value = true
  }
  input.value = ''
}

function onLogoCropped(dataUrl: string) {
  form.logoUrl = dataUrl
}

// ── Validation ─────────────────────────────────────────
const stepErrors = computed(() => {
  const errors: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] }
  if (!form.communityName) errors[0].push('communityName')
  if (!form.contactName) errors[0].push('contactName')
  if (form.discordUrl && !isDiscordValid.value) errors[3].push('discordUrl')
  return errors
})

function stepHasErrors(i: number): boolean {
  return (stepErrors.value[i]?.length || 0) > 0
}

const isDiscordValid = computed(() => {
  if (!form.discordUrl) return true
  return /^https?:\/\/(discord\.gg\/|discord\.com\/invite\/)/.test(form.discordUrl)
})

// ── Navigation ─────────────────────────────────────────
function goToStep(i: number) {
  step.value = i
}

function nextStep() {
  // Validate current step before proceeding
  const currentErrors = stepErrors.value[step.value] || []
  if (currentErrors.length > 0 && step.value === 0) {
    touched.communityName = true
    touched.contactName = true
    const firstErr = currentErrors[0]
    shakeField.value = firstErr
    setTimeout(() => { shakeField.value = '' }, 600)
    error.value = 'Veuillez remplir les champs obligatoires avant de continuer.'
    return
  }
  error.value = ''
  step.value++
}

function prevStep() {
  step.value--
}

// Keyboard shortcuts: Alt+Left / Alt+Right
if (import.meta.client) {
  onMounted(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return
      if (e.key === 'ArrowLeft' && step.value > 0) {
        e.preventDefault()
        prevStep()
      } else if (e.key === 'ArrowRight' && step.value < steps.length - 1) {
        e.preventDefault()
        nextStep()
      }
    }
    window.addEventListener('keydown', handler)
    onUnmounted(() => window.removeEventListener('keydown', handler))
  })
}

// ── Completion percentage ──────────────────────────────
const completionPercent = computed(() => {
  let total = 0
  let filled = 0
  // Required fields (high weight)
  total += 15; if (form.communityName) filled += 15
  total += 15; if (form.contactName) filled += 15
  // Optional info fields
  total += 8; if (form.shortDescription) filled += 8
  total += 8; if (form.description) filled += 8
  total += 5; if (form.objectives) filled += 5
  // Classification
  total += 7; if (form.communityType) filled += 7
  total += 5; if (form.sizeCategory) filled += 5
  total += 5; if (form.recruitmentStatus) filled += 5
  total += 5; if (form.eventFrequency) filled += 5
  total += 4; if (form.historicalPeriods.length) filled += 4
  // Modules & XP
  total += 6; if (form.moduleNames.length) filled += 6
  total += 3; if (form.soughtModuleNames.length) filled += 3
  total += 4; if (form.experienceNames.length) filled += 4
  // Links
  total += 7; if (form.discordUrl) filled += 7
  total += 3; if (form.websiteUrl) filled += 3
  // Media
  total += 5; if (form.logoUrl) filled += 5
  total += 3; if (screenshots.value.length) filled += 3
  return Math.round((filled / total) * 100)
})

// ── Helpers ────────────────────────────────────────────
function toggleArray(arr: string[], value: string) {
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
}

// ── LocalStorage draft ─────────────────────────────────
const DRAFT_KEY = 'soumettre-draft'
const hasDraft = ref(false)
const draftRestored = ref(false)

if (import.meta.client) {
  onMounted(() => {
    hasDraft.value = !!localStorage.getItem(DRAFT_KEY)
  })
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const draft = JSON.parse(raw)
      Object.assign(form, draft)
      draftRestored.value = true
      hasDraft.value = false
    }
  } catch { /* ignore corrupted draft */ }
}

function discardDraft() {
  localStorage.removeItem(DRAFT_KEY)
  hasDraft.value = false
}

// Auto-save draft every 3s
let draftTimer: ReturnType<typeof setInterval>
if (import.meta.client) {
  onMounted(() => {
    draftTimer = setInterval(() => {
      if (!submitted.value) {
        // Save draft WITHOUT image data (base64 is too large for localStorage)
        const { logoUrl: _logo, ...draftFields } = form
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftFields))
      }
    }, 3000)
  })
  onUnmounted(() => clearInterval(draftTimer))
}

// ── Unsaved changes warning ────────────────────────────
const isFormDirty = computed(() => {
  return !submitted.value && (
    form.communityName !== '' || form.contactName !== '' || form.description !== '' ||
    form.moduleNames.length > 0 || form.discordUrl !== '' ||
    form.logoUrl !== '' || screenshots.value.length > 0
  )
})

if (import.meta.client) {
  onMounted(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isFormDirty.value) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handler)
    onUnmounted(() => window.removeEventListener('beforeunload', handler))
  })
}

// ── Submit ─────────────────────────────────────────────
async function submit() {
  if (!form.communityName || !form.contactName) {
    error.value = 'Le nom de la communauté et le contact sont obligatoires.'
    step.value = 0
    touched.communityName = true
    touched.contactName = true
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/submissions', {
      method: 'POST',
      body: {
        ...form,
        images: screenshots.value.length
          ? screenshots.value.map(url => ({ url, alt: null }))
          : null,
      },
    })
    // Clear draft
    localStorage.removeItem(DRAFT_KEY)
    // Confetti!
    try {
      const confetti = (await import('canvas-confetti')).default
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    } catch { /* confetti is non-critical */ }
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Erreur lors de l\'envoi.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Step slide transitions ── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ── Shake animation for required fields ── */
.shake-field {
  animation: shake 0.5s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-6px); }
  30% { transform: translateX(5px); }
  45% { transform: translateX(-4px); }
  60% { transform: translateX(3px); }
  75% { transform: translateX(-1px); }
}
</style>
