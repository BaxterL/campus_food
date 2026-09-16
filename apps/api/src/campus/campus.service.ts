import { Injectable } from '@nestjs/common';
import { NotFoundError } from '@campus-food/domain';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAddressDto, CreateBuildingDto, CreateCampusDto } from './campus.dto.js';

@Injectable()
export class CampusService {
  constructor(private readonly prisma: PrismaService) {}

  listCampuses() {
    return this.prisma.campus.findMany({ where: { active: true }, include: { buildings: true } });
  }

  listBuildings(campusId?: string) {
    return this.prisma.building.findMany({
      where: { active: true, ...(campusId ? { campusId } : {}) },
    });
  }

  createCampus(dto: CreateCampusDto) {
    return this.prisma.campus.create({ data: dto });
  }

  async createBuilding(dto: CreateBuildingDto) {
    const campus = await this.prisma.campus.findUnique({ where: { id: dto.campusId } });
    if (!campus) throw new NotFoundError('Campus');
    return this.prisma.building.create({ data: dto });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const building = await this.prisma.building.findUnique({ where: { id: dto.buildingId } });
    if (!building) throw new NotFoundError('Building');
    const contact = dto.contact ?? dto.contactName;
    const phone = dto.phone ?? dto.contactPhone;
    if (!contact || !phone) throw new NotFoundError('Contact');
    if (dto.isDefault) {
      await this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.address.create({
      data: {
        buildingId: dto.buildingId,
        room: dto.room,
        contact,
        phone,
        userId,
        isDefault: dto.isDefault ?? false,
      },
      include: { building: true },
    }).then((row) => ({
      id: row.id,
      buildingId: row.buildingId,
      buildingName: row.building.name,
      room: row.room,
      contactName: row.contact,
      contactPhone: row.phone,
      isDefault: row.isDefault,
    }));
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      include: { building: { include: { campus: true } } },
    }).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        buildingId: row.buildingId,
        buildingName: row.building.name,
        room: row.room,
        contactName: row.contact,
        contactPhone: row.phone,
        isDefault: row.isDefault,
      })),
    );
  }

  async updateAddress(userId: string, id: string, dto: Partial<CreateAddressDto>) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundError('Address');
    return this.prisma.address.update({
      where: { id },
      data: {
        room: dto.room,
        contact: dto.contact ?? dto.contactName,
        phone: dto.phone ?? dto.contactPhone,
        isDefault: dto.isDefault,
      },
    });
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundError('Address');
    await this.prisma.address.delete({ where: { id } });
    return { ok: true };
  }
}
