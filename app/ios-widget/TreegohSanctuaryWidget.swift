//
//  TreegohSanctuaryWidget.swift
//  TreegohWidgetExtension — iOS WidgetKit (Home Screen & Lock Screen)
//
//  Soporta 6 familias de widgets nativos de iOS estilo Duolingo y Spotify
//  con compatibilidad completa para iOS 16, iOS 17 y iOS 18+ (containerBackground):
//  - systemSmall (2x2 — Cuadrado Pequeño): Racha Botánica Duolingo + Estado de Riego
//  - systemMedium (4x2 — Rectangular Mediano): Radar del Santuario estilo Spotify + Próximo riego
//  - systemLarge (4x4 — Cuadrado Grande): Panel Completo del Santuario + Agenda de 4 especies
//  - accessoryCircular (Lock Screen): Anillo de Racha del Santuario
//  - accessoryRectangular (Lock Screen): Próximo riego e hidratación en pantalla de bloqueo
//  - accessoryInline (Lock Screen): Línea superior sobre el reloj de bloqueo
//
//  Cumplimiento estricto: Cero emojis. Tipografía institucional limpia.
//

import WidgetKit
import SwiftUI

struct WidgetPlantItem: Codable {
    let name: String
    let spaceName: String
    let daysUntilWatering: Int
    let status: String
}

struct SanctuaryWidgetData: Codable {
    let sanctuaryName: String
    let streakDays: Int
    let streakTitle: String
    let duoMessageTitle: String
    let duoMessageBody: String
    let urgency: String
    let pendingWateringsCount: Int
    let pendingOtherCount: Int
    let nextWateringPlantName: String
    let nextWateringSpaceName: String
    let nextWateringDays: Int
    let totalPlantsCount: Int
    let temperatureCelsius: Int?
    let widgetTheme: String?
    let topPlants: [WidgetPlantItem]?

    static let defaultPlants: [WidgetPlantItem] = [
        WidgetPlantItem(name: "Costilla de Adán", spaceName: "Salón Principal", daysUntilWatering: 0, status: "necesita_riego"),
        WidgetPlantItem(name: "Ficus Violín", spaceName: "Salón Principal", daysUntilWatering: 3, status: "optimo"),
        WidgetPlantItem(name: "Calathea Orbifolia", spaceName: "Dormitorio", daysUntilWatering: 4, status: "hidratada"),
        WidgetPlantItem(name: "Cuna de Moisés", spaceName: "Salón Principal", daysUntilWatering: 1, status: "atencion")
    ]

    static let placeholder = SanctuaryWidgetData(
        sanctuaryName: "Salón Principal",
        streakDays: 7,
        streakTitle: "Sembrador Constante",
        duoMessageTitle: "Santuario en equilibrio",
        duoMessageBody: "Tus hojas mantienen su turgencia y humedad óptima hoy.",
        urgency: "optimo",
        pendingWateringsCount: 0,
        pendingOtherCount: 1,
        nextWateringPlantName: "Monstera Deliciosa",
        nextWateringSpaceName: "Salón Principal",
        nextWateringDays: 2,
        totalPlantsCount: 12,
        temperatureCelsius: 22,
        widgetTheme: "clorofila_nocturna",
        topPlants: defaultPlants
    )
}

struct SanctuaryTimelineEntry: TimelineEntry {
    let date: Date
    let data: SanctuaryWidgetData
}

struct SanctuaryTimelineProvider: TimelineProvider {
    private let appGroupId = "group.com.treegoh.app"
    private let payloadKey = "treegoh_sanctuary_widget_payload"

    func placeholder(in context: Context) -> SanctuaryTimelineEntry {
        SanctuaryTimelineEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SanctuaryTimelineEntry) -> Void) {
        completion(SanctuaryTimelineEntry(date: Date(), data: loadFromSharedDefaults()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SanctuaryTimelineEntry>) -> Void) {
        let entry = SanctuaryTimelineEntry(date: Date(), data: loadFromSharedDefaults())
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }

    private func loadFromSharedDefaults() -> SanctuaryWidgetData {
        if let sharedDefaults = UserDefaults(suiteName: appGroupId),
           let jsonString = sharedDefaults.string(forKey: payloadKey),
           let jsonData = jsonString.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(SanctuaryWidgetData.self, from: jsonData) {
            return decoded
        }
        if let standardJson = UserDefaults.standard.string(forKey: payloadKey),
           let jsonData = standardJson.data(using: .utf8),
           let decoded = try? JSONDecoder().decode(SanctuaryWidgetData.self, from: jsonData) {
            return decoded
        }
        return .placeholder
    }
}

extension View {
    @ViewBuilder
    func treegohContainerBackground<BG: View>(@ViewBuilder backgroundView: () -> BG) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(for: .widget) {
                backgroundView()
            }
        } else {
            self.padding(14)
                .background(backgroundView())
        }
    }
}

// MARK: - 1. Vista Widget Pequeño (2x2 — Cuadrado Pequeño Estilo Duolingo)
struct TreegohSmallWidgetView: View {
    let data: SanctuaryWidgetData

    var isSalviaTheme: Bool {
        data.widgetTheme == "salvia_duolingo"
    }

    var isUrgent: Bool {
        data.urgency == "urgente" || data.pendingWateringsCount > 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("treegöh")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : Color(red: 0.90, green: 0.91, blue: 0.77))

                Spacer()

                Text("\(data.streakDays) d")
                    .font(.system(size: 11, weight: .medium))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(
                        Capsule()
                            .fill(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.12) : Color(red: 0.53, green: 0.94, blue: 0.67).opacity(0.18))
                    )
                    .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : Color(red: 0.53, green: 0.94, blue: 0.67))
            }

            Spacer(minLength: 2)

            Text(data.duoMessageTitle)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : .white)
                .lineLimit(1)

            Text(isUrgent ? "\(data.nextWateringPlantName) pide riego hoy" : "Próximo: \(data.nextWateringPlantName) (\(data.nextWateringDays)d)")
                .font(.system(size: 11.5, weight: .light))
                .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.75) : Color.white.opacity(0.72))
                .lineLimit(2)

            Spacer(minLength: 2)

            HStack(spacing: 5) {
                Circle()
                    .fill(isUrgent ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color(red: 0.53, green: 0.94, blue: 0.67))
                    .frame(width: 6, height: 6)

                Text("\(data.sanctuaryName) · \(data.totalPlantsCount) plantas")
                    .font(.system(size: 10, weight: .light))
                    .foregroundColor(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.65) : Color.white.opacity(0.58))
                    .lineLimit(1)
            }
        }
        .treegohContainerBackground {
            LinearGradient(
                colors: isSalviaTheme
                    ? [Color(red: 0.90, green: 0.91, blue: 0.77), Color(red: 0.84, green: 0.88, blue: 0.72)]
                    : [Color(red: 0.04, green: 0.09, blue: 0.06), Color(red: 0.07, green: 0.16, blue: 0.11)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - 2. Vista Widget Mediano (4x2 — Rectangular Estilo Spotify / Duolingo)
struct TreegohMediumWidgetView: View {
    let data: SanctuaryWidgetData

    var isUrgent: Bool {
        data.urgency == "urgente" || data.pendingWateringsCount > 0
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text("treegöh")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundColor(Color(red: 0.90, green: 0.91, blue: 0.77))

                    Text("· \(data.streakDays) días")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(red: 0.53, green: 0.94, blue: 0.67))
                }

                Spacer(minLength: 2)

                Text(data.duoMessageTitle)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Text(data.duoMessageBody)
                    .font(.system(size: 11.5, weight: .light))
                    .foregroundColor(Color.white.opacity(0.74))
                    .lineLimit(2)

                Spacer(minLength: 2)

                Text("\(data.sanctuaryName) · \(data.temperatureCelsius ?? 22)°C")
                    .font(.system(size: 10.5, weight: .light))
                    .foregroundColor(Color(red: 0.90, green: 0.91, blue: 0.77).opacity(0.8))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(isUrgent ? "RIEGO URGENTE HOY" : "PRÓXIMO RIEGO")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(isUrgent ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color(red: 0.53, green: 0.94, blue: 0.67))

                    Text(data.nextWateringPlantName)
                        .font(.system(size: 12.5, weight: .regular))
                        .foregroundColor(.white)
                        .lineLimit(1)

                    Text(isUrgent ? "Hidratar sustrato hoy" : "En \(data.nextWateringDays) días · \(data.nextWateringSpaceName)")
                        .font(.system(size: 10, weight: .light))
                        .foregroundColor(Color.white.opacity(0.65))
                        .lineLimit(1)
                }
                .padding(10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.white.opacity(0.08))
                )

                HStack {
                    Text("\(data.totalPlantsCount) especies")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(Color.white.opacity(0.82))

                    Spacer()

                    Text(data.pendingWateringsCount > 0 ? "\(data.pendingWateringsCount) sedientas" : "Al día")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(data.pendingWateringsCount > 0 ? Color(red: 0.97, green: 0.44, blue: 0.44) : Color(red: 0.53, green: 0.94, blue: 0.67))
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white.opacity(0.06))
                )
            }
            .frame(width: 140)
        }
        .treegohContainerBackground {
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.09, blue: 0.06),
                    Color(red: 0.07, green: 0.16, blue: 0.11)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - 3. Vista Widget Cuadrado Grande (4x4 — Panel Completo del Santuario)
struct TreegohLargeWidgetView: View {
    let data: SanctuaryWidgetData

    var isSalviaTheme: Bool {
        data.widgetTheme == "salvia_duolingo"
    }

    var isUrgent: Bool {
        data.urgency == "urgente" || data.pendingWateringsCount > 0
    }

    var plantList: [WidgetPlantItem] {
        if let items = data.topPlants, !items.isEmpty {
            return Array(items.prefix(4))
        }
        return SanctuaryWidgetData.defaultPlants
    }

    var primaryText: Color {
        isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08) : .white
    }

    var secondaryText: Color {
        isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.70) : Color.white.opacity(0.70)
    }

    var accentColor: Color {
        isSalviaTheme ? Color(red: 0.08, green: 0.38, blue: 0.22) : Color(red: 0.53, green: 0.94, blue: 0.67)
    }

    var cardSurface: Color {
        isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.07) : Color.white.opacity(0.07)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // 1. Cabecera superior: Marca + Estancia/Clima + Racha Duolingo
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("treegöh")
                        .font(.system(size: 13.5, weight: .regular))
                        .foregroundColor(isSalviaTheme ? primaryText : Color(red: 0.90, green: 0.91, blue: 0.77))

                    Text("\(data.sanctuaryName) · \(data.temperatureCelsius ?? 22)°C")
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(secondaryText)
                        .lineLimit(1)
                }

                Spacer()

                HStack(spacing: 5) {
                    Text("Racha \(data.streakDays) d")
                        .font(.system(size: 11.5, weight: .medium))
                        .foregroundColor(accentColor)
                }
                .padding(.horizontal, 11)
                .padding(.vertical, 5)
                .background(
                    Capsule()
                        .fill(isSalviaTheme ? Color(red: 0.06, green: 0.12, blue: 0.08).opacity(0.10) : Color(red: 0.53, green: 0.94, blue: 0.67).opacity(0.16))
                )
            }

            // 2. Tarjeta Hero de Estado del Santuario
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(data.duoMessageTitle)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(primaryText)
                        .lineLimit(1)

                    Spacer()

                    Text(data.streakTitle)
                        .font(.system(size: 10.5, weight: .light))
                        .foregroundColor(accentColor)
                        .lineLimit(1)
                }

                Text(data.duoMessageBody)
                    .font(.system(size: 11.5, weight: .light))
                    .foregroundColor(secondaryText)
                    .lineLimit(2)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(cardSurface)
            )

            // 3. Agenda de las 4 especies principales del Santuario
            Text("CALENDARIO DE ESPECIES (\(data.totalPlantsCount))")
                .font(.system(size: 9.5, weight: .medium))
                .foregroundColor(accentColor)
                .padding(.top, 2)

            VStack(spacing: 6) {
                ForEach(Array(plantList.enumerated()), id: \.offset) { _, plant in
                    let needsToday = plant.status == "necesita_riego" || plant.daysUntilWatering <= 0
                    HStack(spacing: 10) {
                        Circle()
                            .fill(needsToday ? Color(red: 0.97, green: 0.44, blue: 0.44) : accentColor)
                            .frame(width: 7, height: 7)

                        VStack(alignment: .leading, spacing: 1) {
                            Text(plant.name)
                                .font(.system(size: 12.5, weight: .regular))
                                .foregroundColor(primaryText)
                                .lineLimit(1)

                            Text(plant.spaceName)
                                .font(.system(size: 10, weight: .light))
                                .foregroundColor(secondaryText)
                                .lineLimit(1)
                        }

                        Spacer()

                        Text(needsToday ? "Riego hoy" : plant.status == "hidratada" ? "Hidratada" : "En \(plant.daysUntilWatering)d")
                            .font(.system(size: 10.5, weight: .medium))
                            .padding(.horizontal, 9)
                            .padding(.vertical, 3.5)
                            .background(
                                Capsule()
                                    .fill(needsToday ? Color(red: 0.97, green: 0.44, blue: 0.44).opacity(0.18) : cardSurface)
                            )
                            .foregroundColor(needsToday ? Color(red: 0.97, green: 0.44, blue: 0.44) : accentColor)
                    }
                    .padding(.horizontal, 11)
                    .padding(.vertical, 7)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(cardSurface)
                    )
                }
            }

            Spacer(minLength: 0)

            // 4. Pie de resumen del Santuario
            HStack {
                Text(data.pendingWateringsCount > 0 ? "\(data.pendingWateringsCount) plantas piden hidratación hoy" : "Todas tus especies están en equilibrio hídrico")
                    .font(.system(size: 10.5, weight: .light))
                    .foregroundColor(secondaryText)
                    .lineLimit(1)

                Spacer()
            }
        }
        .treegohContainerBackground {
            LinearGradient(
                colors: isSalviaTheme
                    ? [Color(red: 0.90, green: 0.91, blue: 0.77), Color(red: 0.84, green: 0.88, blue: 0.72)]
                    : [Color(red: 0.04, green: 0.09, blue: 0.06), Color(red: 0.07, green: 0.16, blue: 0.11)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }
}

// MARK: - 4. Vistas para Pantalla de Bloqueo de iOS (Lock Screen)
@available(iOSApplicationExtension 16.0, *)
struct TreegohLockScreenCircularView: View {
    let data: SanctuaryWidgetData

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Text("\(data.streakDays)")
                    .font(.system(size: 16, weight: .semibold))
                Text("DÍAS")
                    .font(.system(size: 7.5, weight: .regular))
            }
        }
        .treegohContainerBackground {
            Color.clear
        }
    }
}

@available(iOSApplicationExtension 16.0, *)
struct TreegohLockScreenRectangularView: View {
    let data: SanctuaryWidgetData

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("treegöh · Racha \(data.streakDays)d")
                .font(.system(size: 11, weight: .semibold))
            Text(data.pendingWateringsCount > 0 ? "Riego hoy: \(data.nextWateringPlantName)" : "Próximo: \(data.nextWateringPlantName) (\(data.nextWateringDays)d)")
                .font(.system(size: 11, weight: .regular))
                .lineLimit(1)
            Text("\(data.sanctuaryName) · \(data.totalPlantsCount) plantas")
                .font(.system(size: 10, weight: .light))
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
        .treegohContainerBackground {
            Color.clear
        }
    }
}

@available(iOSApplicationExtension 16.0, *)
struct TreegohLockScreenInlineView: View {
    let data: SanctuaryWidgetData

    var body: some View {
        Text(data.pendingWateringsCount > 0
             ? "treegöh · Racha \(data.streakDays)d · Riego hoy: \(data.nextWateringPlantName)"
             : "treegöh · Racha \(data.streakDays)d · Santuario al día")
    }
}

struct TreegohSanctuaryWidgetEntryView: View {
    var entry: SanctuaryTimelineProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            TreegohSmallWidgetView(data: entry.data)
        case .systemMedium:
            TreegohMediumWidgetView(data: entry.data)
        case .systemLarge:
            TreegohLargeWidgetView(data: entry.data)
        case .accessoryCircular:
            if #available(iOSApplicationExtension 16.0, *) {
                TreegohLockScreenCircularView(data: entry.data)
            } else {
                TreegohSmallWidgetView(data: entry.data)
            }
        case .accessoryRectangular:
            if #available(iOSApplicationExtension 16.0, *) {
                TreegohLockScreenRectangularView(data: entry.data)
            } else {
                TreegohSmallWidgetView(data: entry.data)
            }
        case .accessoryInline:
            if #available(iOSApplicationExtension 16.0, *) {
                TreegohLockScreenInlineView(data: entry.data)
            } else {
                TreegohSmallWidgetView(data: entry.data)
            }
        default:
            TreegohLargeWidgetView(data: entry.data)
        }
    }
}

@main
struct TreegohSanctuaryWidget: Widget {
    let kind: String = "TreegohSanctuaryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SanctuaryTimelineProvider()) { entry in
            TreegohSanctuaryWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Treegoh Santuario")
        .description("Racha botánica estilo Duolingo, calendario de especies y microclima en pequeño (2x2), mediano (4x2), cuadrado grande (4x4) y pantalla de bloqueo.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline
        ])
    }
}
