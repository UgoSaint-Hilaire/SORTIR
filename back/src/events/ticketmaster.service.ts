import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getClassificationName } from "./ticketmaster-classifications";
import { EventsService } from "./events.service";

/**
 * Service pour récupérer les événements depuis l'API Ticketmaster
 * Permet de récupérer les événements par catégorie : Musique, Sports, Arts & Théâtre
 */
@Injectable()
export class TicketmasterService {
  private readonly logger = new Logger(TicketmasterService.name);

  private readonly apiKey: string;

  private readonly baseUrl = "https://app.ticketmaster.com/discovery/v2";

  constructor(
    private readonly configService: ConfigService,
    private readonly eventsService: EventsService
  ) {
    this.apiKey = this.configService.get("TICKETMASTER_API_KEY");

    if (!this.apiKey) {
      this.logger.warn("TICKETMASTER_API_KEY not valid");
    }
  }

  /**
   * Fonction qui récupère les événements jour par jour pour éviter les limites de l'API
   */
  private async getEventsBySegmentInFrance(
    segmentId: string,
    segmentName: string,
    numberOfDays: number
  ): Promise<{
    events: any[];
    saveStats: { saved: number; updated: number; errors: number };
  }> {
    if (!this.apiKey) {
      throw new Error("Ticketmaster API key not valid");
    }

    const allEvents = [];
    let totalSaved = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    this.logger.log(`!!! Début de la récupération ${segmentName} sur ${numberOfDays} jours (jour par jour)...`);

    for (let dayOffset = 0; dayOffset < numberOfDays; dayOffset++) {
      try {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + dayOffset);
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        // Format ISO pour l'API
        const startDateTime = currentDate.toISOString().split("T")[0] + "T00:00:00Z";
        const endDateTime = nextDate.toISOString().split("T")[0] + "T00:00:00Z";

        this.logger.log(`!!! Jour ${dayOffset + 1}/${numberOfDays}: ${currentDate.toLocaleDateString("fr-FR")}`);

        const dayEvents = await this.fetchEventsForSingleDay(segmentId, segmentName, startDateTime, endDateTime);

        if (dayEvents.length > 0) {
          const segmentNameEvents = this.addCorrespondingNameOfSegment(dayEvents);
          const saveResult = await this.eventsService.saveInDBEvents(segmentNameEvents, segmentName);

          allEvents.push(...segmentNameEvents);
          totalSaved += saveResult.saved;
          totalUpdated += saveResult.updated;
          totalErrors += saveResult.errors;

          this.logger.log(
            `!!! ${dayEvents.length} événements trouvés, ${saveResult.saved} nouveaux, ${saveResult.updated} mis à jour`
          );
        } else {
          this.logger.log(`!!! Aucun événement ce jour`);
        }

        // Pause pour éviter les restrictions rate de l'API
        if (dayOffset < numberOfDays - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        this.logger.error(`!!! Erreur jour ${dayOffset + 1}: ${error.message}`);
        totalErrors++;
      }
    }

    this.logger.log(`!!! Récupération ${segmentName} terminée: ${allEvents.length} événements au total`);
    this.logger.log(`!!! Bilan: ${totalSaved} nouveaux, ${totalUpdated} mis à jour, ${totalErrors} erreurs`);

    return {
      events: allEvents,
      saveStats: { saved: totalSaved, updated: totalUpdated, errors: totalErrors },
    };
  }

  /**
   * Récupère les événements pour une seule journée
   */
  private async fetchEventsForSingleDay(
    segmentId: string,
    segmentName: string,
    startDateTime: string,
    endDateTime: string
  ): Promise<any[]> {
    const allEvents = [];
    let currentPage = 0;
    let totalPages = 1;

    do {
      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        countryCode: "FR",
        locale: "fr-FR",
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        segmentId: segmentId,
        size: "200", // Maximum par page
        page: currentPage.toString(),
      });

      const apiUrl = `${this.baseUrl}/events.json?${searchParams}`;
      const apiResponse = await fetch(apiUrl);

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`API error ${apiResponse.status}: ${errorText}`);
      }

      const responseData = await apiResponse.json();
      const eventsOnThisPage = responseData._embedded?.events || [];
      totalPages = responseData.page.totalPages;

      allEvents.push(...eventsOnThisPage);
      currentPage++;

      if (currentPage < totalPages) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } while (currentPage < totalPages && currentPage < 20); // Limite à 20 pages par jour

    return allEvents;
  }

  /**
   * Enrichit les événements en ajoutant des noms explicites
   * Remplace les IDs par le name qui correspond (ex: "KnvZfZ7vAeA" → "Rock")
   */
  private addCorrespondingNameOfSegment(events: any[]): any[] {
    return events.map((event, index) => {
      if (event.classifications && event.classifications.length > 0) {
        const classification = event.classifications[0]; // Prendre la première classification

        if (classification.segment?.id) {
          const frenchSegmentName = getClassificationName(classification.segment.id);
          classification.segment.name = frenchSegmentName || "undefined";
        }

        if (classification.genre?.id) {
          const frenchGenreName = getClassificationName(classification.genre.id);
          classification.genre.name = frenchGenreName || "undefined";
        }
      }

      return event;
    });
  }

  /**
   * Récupère et sauvegarde TOUS les événements français (Musique, Sports, Arts & Théâtre)
   * Fait la recherche jour par jour pour éviter les limites de l'API
   */
  async fetchAllFrenchEvents(totalDays: number = 60): Promise<{
    events: any[];
    saveStats: { saved: number; updated: number; errors: number };
  }> {
    const segments = [
      { id: "KZFzniwnSyZfZ7v7nJ", name: "MUSIQUE" },
      { id: "KZFzniwnSyZfZ7v7nE", name: "SPORTS" },
      { id: "KZFzniwnSyZfZ7v7na", name: "ARTS & THEATRE" },
    ];

    const allEvents = [];
    let totalSaved = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    const categoryStats = {};

    for (const segment of segments) {
      this.logger.log(`!!! Début de la recherche ${segment.name}...`);

      const result = await this.getEventsBySegmentInFrance(segment.id, segment.name, totalDays);

      // Enregistrer les stats par catégorie
      categoryStats[segment.name] = {
        total: result.events.length,
        saved: result.saveStats.saved,
        updated: result.saveStats.updated,
      };

      allEvents.push(...result.events);
      totalSaved += result.saveStats.saved;
      totalUpdated += result.saveStats.updated;
      totalErrors += result.saveStats.errors;
    }

    // Rapport détaillé par catégorie
    // @TODO: Créer un fichier de log
    this.logger.log(`!!! Synchronisation terminée: ${allEvents.length} événements au total (${totalDays} jours)`);
    this.logger.log(`!!! Détail par catégorie:`);
    this.logger.log(
      `  - MUSIQUE: ${categoryStats["MUSIQUE"]?.total || 0} événements (${categoryStats["MUSIQUE"]?.saved || 0} nouveaux, ${categoryStats["MUSIQUE"]?.updated || 0} mis à jour)`
    );
    this.logger.log(
      `  - SPORTS: ${categoryStats["SPORTS"]?.total || 0} événements (${categoryStats["SPORTS"]?.saved || 0} nouveaux, ${categoryStats["SPORTS"]?.updated || 0} mis à jour)`
    );
    this.logger.log(
      `  - ARTS & THEATRE: ${categoryStats["ARTS & THEATRE"]?.total || 0} événements (${categoryStats["ARTS & THEATRE"]?.saved || 0} nouveaux, ${categoryStats["ARTS & THEATRE"]?.updated || 0} mis à jour)`
    );

    return {
      events: allEvents,
      saveStats: { saved: totalSaved, updated: totalUpdated, errors: totalErrors },
    };
  }
}
