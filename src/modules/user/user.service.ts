import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_TOKEN } from 'src/shared/supabase/supabase.tokens';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @Inject(SUPABASE_ADMIN_TOKEN)
    private readonly supabaseAdmin: SupabaseClient,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    const { name, email, password } = data;
    let createdSupabaseUserId: string | null = null;

    try {
      const exists = await this.userRepo.exists({ where: { email } });

      if (exists)
        throw new ConflictException('Você não pode utilizar esse e-mail');

      const { data: supabaseData, error: supabaseError } =
        await this.supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

      console.log({
        supabaseData,
        supabaseError,
      });

      if (supabaseError || !supabaseData.user) {
        throw new BadRequestException(
          supabaseError?.message || 'Erro ao criar usuário.',
        );
      }

      createdSupabaseUserId = supabaseData.user.id;

      const user = {
        name,
        email,
        auth_id: supabaseData.user.id,
      };
      return await this.userRepo.save(user);
    } catch (error) {
      if (createdSupabaseUserId) {
        console.log(
          `Falha ao salvar usuário no DB local. Revertendo criação no Supabase para o ID: ${createdSupabaseUserId}`,
        );

        await this.supabaseAdmin.auth.admin.deleteUser(createdSupabaseUserId);
      }

      throw error;
    }
  }

  async findOneByOrFail(where: Partial<User>): Promise<User> {
    return this.userRepo.findOneByOrFail(where);
  }
}
